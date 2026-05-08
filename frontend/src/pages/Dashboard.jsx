import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, workspaceId, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Welcome, {user?.name}
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Workspace ID: {workspaceId}
        </p>
        <button
          onClick={logout}
          className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
