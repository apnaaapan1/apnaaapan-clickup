const pool = require('../config/db');

const createProject = async (req, res) => {
  const { workspaceId } = req.params;
  const userId = req.user.userId;
  const { name, description, color } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Project name is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO projects (workspace_id, name, description, color, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [workspaceId, name.trim(), description || null, color || '#6366f1', userId]
    );

    return res.status(201).json({ success: true, project: result.rows[0] });
  } catch (err) {
    console.error('createProject error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAllProjects = async (req, res) => {
  const { workspaceId } = req.params;
  const includeLists = req.query.includeLists === 'true';

  try {
    const result = await pool.query(
      `SELECT * FROM projects
       WHERE workspace_id = $1 AND status = 'active'
       ORDER BY created_at DESC`,
      [workspaceId]
    );

    const projects = result.rows;

    if (!includeLists || projects.length === 0) {
      return res.status(200).json({ success: true, projects });
    }

    const ids = projects.map((p) => p.id);
    const listsResult = await pool.query(
      `SELECT * FROM lists WHERE project_id = ANY($1::uuid[]) ORDER BY project_id, position ASC`,
      [ids]
    );

    const listsByProjectId = {};
    for (const row of listsResult.rows) {
      if (!listsByProjectId[row.project_id]) listsByProjectId[row.project_id] = [];
      listsByProjectId[row.project_id].push(row);
    }

    for (const p of projects) {
      p.lists = listsByProjectId[p.id] || [];
    }

    return res.status(200).json({ success: true, projects });
  } catch (err) {
    console.error('getAllProjects error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSingleProject = async (req, res) => {
  const { workspaceId, projectId } = req.params;

  try {
    const projectResult = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND workspace_id = $2',
      [projectId, workspaceId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const listsResult = await pool.query(
      'SELECT * FROM lists WHERE project_id = $1 ORDER BY position ASC',
      [projectId]
    );

    const project = projectResult.rows[0];
    project.lists = listsResult.rows;

    return res.status(200).json({ success: true, project });
  } catch (err) {
    console.error('getSingleProject error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateProject = async (req, res) => {
  const { projectId, workspaceId } = req.params;
  const { name, description, color, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE projects
       SET name        = COALESCE($1, name),
           description = COALESCE($2, description),
           color       = COALESCE($3, color),
           status      = COALESCE($4, status),
           updated_at  = NOW()
       WHERE id = $5 AND workspace_id = $6
       RETURNING *`,
      [name || null, description || null, color || null, status || null, projectId, workspaceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    return res.status(200).json({ success: true, project: result.rows[0] });
  } catch (err) {
    console.error('updateProject error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteProject = async (req, res) => {
  const { projectId, workspaceId } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 AND workspace_id = $2 RETURNING id',
      [projectId, workspaceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    return res.status(200).json({ success: true, message: 'Project deleted' });
  } catch (err) {
    console.error('deleteProject error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createProject, getAllProjects, getSingleProject, updateProject, deleteProject };
