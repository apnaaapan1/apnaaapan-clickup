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

const moveList = async (req, res) => {
  const { workspaceId, projectId, listId } = req.params;
  const { targetProjectId } = req.body;

  if (!targetProjectId) {
    return res.status(400).json({ success: false, message: 'targetProjectId is required' });
  }

  if (String(targetProjectId) === String(projectId)) {
    return res.status(400).json({ success: false, message: 'List is already in this space' });
  }

  const client = await pool.connect();

  try {
    const wsProjects = await client.query(
      `SELECT id FROM projects WHERE workspace_id = $1 AND id = ANY($2::uuid[]) AND status = 'active'`,
      [workspaceId, [projectId, targetProjectId]]
    );
    if (wsProjects.rows.length !== 2) {
      return res.status(404).json({ success: false, message: 'Space not found' });
    }

    await client.query('BEGIN');

    const listRow = await client.query(
      'SELECT id FROM lists WHERE id = $1 AND project_id = $2 FOR UPDATE',
      [listId, projectId]
    );

    if (listRow.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'List not found' });
    }

    const maxPos = await client.query(
      'SELECT COALESCE(MAX(position), 0) AS max_pos FROM lists WHERE project_id = $1',
      [targetProjectId]
    );
    const position = maxPos.rows[0].max_pos + 1;

    const updated = await client.query(
      `UPDATE lists SET project_id = $1, position = $2 WHERE id = $3 RETURNING *`,
      [targetProjectId, position, listId]
    );

    await client.query('COMMIT');

    return res.status(200).json({ success: true, list: updated.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('moveList error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
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

module.exports = { createList, updateList, deleteList, reorderLists, moveList };
