import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import AppLayout from './components/layout/AppLayout';
import Projects from './pages/Projects';
import ManageSpacesPage from './pages/ManageSpacesPage';
import ProjectDetail from './pages/ProjectDetail';
import WorkspaceSettings from './pages/WorkspaceSettings';
import WorkInProgressPage from './pages/WorkInProgressPage';
import InboxPage from './pages/InboxPage';
import ProfilePage from './pages/ProfilePage';
import MyTasksPage from './pages/MyTasksPage';
import AllPeoplePage from './pages/AllPeoplePage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<InboxPage />} />
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/replies" element={<WorkInProgressPage title="Replies" />} />
              <Route path="/my-tasks" element={<MyTasksPage />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/spaces/manage" element={<ManageSpacesPage />} />
              <Route path="/projects/:projectId" element={<ProjectDetail />} />
              <Route
                path="/projects/:projectId/tasks/:taskId"
                element={<div className="p-6">Task detail coming soon</div>}
              />
              <Route path="/workspace" element={<WorkspaceSettings />} />
              <Route path="/teams/people" element={<AllPeoplePage />} />
              <Route path="/teams/all" element={<WorkInProgressPage title="All Teams" />} />
              <Route path="/teams/analytics" element={<WorkInProgressPage title="Analytics" />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
