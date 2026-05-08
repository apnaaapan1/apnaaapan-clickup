const pool = require('../config/db');

const createTask = async (req, res) => {
  const { listId } = req.params;
  const userId = req.user.userId;
  const { title, description, assignee_id, due_date, priority, parent_task_id } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Task title is required' });
  }

  try {
    const maxPos = await pool.query(
      'SELECT COALESCE(MAX(position), 0) AS max_pos FROM tasks WHERE list_id = $1',
      [listId]
    );

    const position = maxPos.rows[0].max_pos + 1;

    const result = await pool.query(
      `INSERT INTO tasks (list_id, title, description, assignee_id, due_date, priority, parent_task_id, created_by, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        listId,
        title.trim(),
        description || null,
        assignee_id || null,
        due_date || null,
        priority || 'medium',
        parent_task_id || null,
        userId,
        position,
      ]
    );

    const task = result.rows[0];

    if (assignee_id) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, related_task_id)
         VALUES ($1, 'task_assigned', 'You have been assigned a task', $2, $3)`,
        [assignee_id, task.title, task.id]
      );
    }

    return res.status(201).json({ success: true, task });
  } catch (err) {
    console.error('createTask error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAllTasks = async (req, res) => {
  const { listId } = req.params;

  try {
    const result = await pool.query(
      `SELECT t.*,
              u.name  AS assignee_name,
              u.avatar_url AS assignee_avatar
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.list_id = $1 AND t.parent_task_id IS NULL
       ORDER BY t.position ASC`,
      [listId]
    );

    return res.status(200).json({ success: true, tasks: result.rows });
  } catch (err) {
    console.error('getAllTasks error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSingleTask = async (req, res) => {
  const { taskId } = req.params;

  try {
    const taskResult = await pool.query(
      `SELECT t.*,
              u.name  AS assignee_name,
              u.avatar_url AS assignee_avatar
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.id = $1`,
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const subtasks = await pool.query(
      `SELECT t.*,
              u.name  AS assignee_name,
              u.avatar_url AS assignee_avatar
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.parent_task_id = $1
       ORDER BY t.position ASC`,
      [taskId]
    );

    const task = taskResult.rows[0];
    task.subtasks = subtasks.rows;

    return res.status(200).json({ success: true, task });
  } catch (err) {
    console.error('getSingleTask error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateTask = async (req, res) => {
  const { taskId } = req.params;
  const { title, description, status, priority, assignee_id, due_date } = req.body;

  try {
    const existing = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const oldTask = existing.rows[0];

    const result = await pool.query(
      `UPDATE tasks
       SET title       = COALESCE($1, title),
           description = COALESCE($2, description),
           status      = COALESCE($3, status),
           priority    = COALESCE($4, priority),
           assignee_id = COALESCE($5, assignee_id),
           due_date    = COALESCE($6, due_date),
           updated_at  = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        title || null,
        description || null,
        status || null,
        priority || null,
        assignee_id || null,
        due_date || null,
        taskId,
      ]
    );

    const updatedTask = result.rows[0];

    if (status === 'done' && oldTask.status !== 'done' && oldTask.created_by) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, related_task_id)
         VALUES ($1, 'task_completed', 'Task completed', $2, $3)`,
        [oldTask.created_by, updatedTask.title, updatedTask.id]
      );
    }

    return res.status(200).json({ success: true, task: updatedTask });
  } catch (err) {
    console.error('updateTask error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const moveTask = async (req, res) => {
  const { taskId } = req.params;
  const { newListId, position } = req.body;

  if (!newListId) {
    return res.status(400).json({ success: false, message: 'newListId is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE tasks SET list_id = $1, position = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [newListId, position ?? 0, taskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    return res.status(200).json({ success: true, message: 'Task moved' });
  } catch (err) {
    console.error('moveTask error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const reorderTasks = async (req, res) => {
  const { tasks } = req.body;

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ success: false, message: 'Tasks array is required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const item of tasks) {
      await client.query(
        'UPDATE tasks SET position = $1 WHERE id = $2',
        [item.position, item.id]
      );
    }

    await client.query('COMMIT');

    return res.status(200).json({ success: true, message: 'Tasks reordered' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('reorderTasks error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
};

const deleteTask = async (req, res) => {
  const { taskId } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING id',
      [taskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    return res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (err) {
    console.error('deleteTask error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getSingleTask,
  updateTask,
  moveTask,
  reorderTasks,
  deleteTask,
};
