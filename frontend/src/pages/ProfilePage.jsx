import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  const userInitials = useMemo(() => {
    const parts = (user?.name || 'User').trim().split(/\s+/);
    return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-xl border border-gray-200 px-8 py-10 shadow-sm max-w-md w-full">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Profile</h1>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-purple-500 text-white flex items-center justify-center text-lg font-semibold shrink-0">
            {userInitials}
          </div>
          <div className="min-w-0">
            <p className="text-gray-900 font-medium truncate">{user?.name || 'User'}</p>
            <p className="text-sm text-gray-500 truncate">{user?.email || '—'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
