const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { isWorkspaceMember } = require('../middleware/workspaceMiddleware');

const {
  createProject,
  getAllProjects,
  getSingleProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');

const {
  createList,
  updateList,
  deleteList,
  reorderLists,
} = require('../controllers/listController');

const {
  createTask,
  getAllTasks,
  getSingleTask,
  updateTask,
  moveTask,
  reorderTasks,
  deleteTask,
} = require('../controllers/taskController');

const router = express.Router();

const auth = [authMiddleware, isWorkspaceMember];

// --- Projects ---
router.post('/workspaces/:workspaceId/projects', auth, createProject);
router.get('/workspaces/:workspaceId/projects', auth, getAllProjects);
router.get('/workspaces/:workspaceId/projects/:projectId', auth, getSingleProject);
router.patch('/workspaces/:workspaceId/projects/:projectId', auth, updateProject);
router.delete('/workspaces/:workspaceId/projects/:projectId', auth, deleteProject);

// --- Lists ---
router.post('/workspaces/:workspaceId/projects/:projectId/lists', auth, createList);
router.patch('/workspaces/:workspaceId/projects/:projectId/lists/reorder', auth, reorderLists);
router.patch('/workspaces/:workspaceId/projects/:projectId/lists/:listId', auth, updateList);
router.delete('/workspaces/:workspaceId/projects/:projectId/lists/:listId', auth, deleteList);

// --- Tasks ---
router.post('/workspaces/:workspaceId/projects/:projectId/lists/:listId/tasks', auth, createTask);
router.get('/workspaces/:workspaceId/projects/:projectId/lists/:listId/tasks', auth, getAllTasks);
router.patch('/workspaces/:workspaceId/projects/:projectId/lists/:listId/tasks/reorder', auth, reorderTasks);
router.get('/workspaces/:workspaceId/projects/:projectId/lists/:listId/tasks/:taskId', auth, getSingleTask);
router.patch('/workspaces/:workspaceId/projects/:projectId/lists/:listId/tasks/:taskId', auth, updateTask);
router.patch('/workspaces/:workspaceId/projects/:projectId/lists/:listId/tasks/:taskId/move', auth, moveTask);
router.delete('/workspaces/:workspaceId/projects/:projectId/lists/:listId/tasks/:taskId', auth, deleteTask);

module.exports = router;
