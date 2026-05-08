const pool = require('../config/db');

const createList = async (req, res) => {
  const { projectId } = req.params;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'List name is required' });
  }

  try {
    const maxPos = await pool.query(
      'SELECT COALESCE(MAX(position), 0) AS max_pos FROM lists WHERE project_id = $1',
      [projectId]
    );

    const position = maxPos.rows[0].max_pos + 1;

    const result = await pool.query(
      `INSERT INTO lists (project_id, name, position)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [projectId, name.trim(), position]
    );

    return res.status(201).json({ success: true, list: result.rows[0] });
  } catch (err) {
    console.error('createList error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateList = async (req, res) => {
  const { projectId, listId } = req.params;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'List name is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE lists SET name = $1 WHERE id = $2 AND project_id = $3 RETURNING *`,
      [name.trim(), listId, projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'List not found' });
    }

    return res.status(200).json({ success: true, list: result.rows[0] });
  } catch (err) {
    console.error('updateList error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteList = async (req, res) => {
  const { projectId, listId } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM lists WHERE id = $1 AND project_id = $2 RETURNING id',
      [listId, projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'List not found' });
    }

    return res.status(200).json({ success: true, message: 'List deleted' });
  } catch (err) {
    console.error('deleteList error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const reorderLists = async (req, res) => {
  const { lists } = req.body;

  if (!Array.isArray(lists) || lists.length === 0) {
    return res.status(400).json({ success: false, message: 'Lists array is required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const item of lists) {
      await client.query(
        'UPDATE lists SET position = $1 WHERE id = $2',
        [item.position, item.id]
      );
    }

    await client.query('COMMIT');

    return res.status(200).json({ success: true, message: 'Lists reordered' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('reorderLists error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
};

module.exports = { createList, updateList, deleteList, reorderLists };
