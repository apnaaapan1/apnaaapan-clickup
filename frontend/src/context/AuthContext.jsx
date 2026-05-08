import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [workspaceId, setWorkspaceId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    const storedWorkspaceId = localStorage.getItem('workspaceId');

    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedToken);
        setWorkspaceId(storedWorkspaceId);
        setIsAuthenticated(true);
      } catch {
        localStorage.clear();
      }
    }

    setIsLoading(false);
  }, []);

  const login = (userData, newAccessToken, refreshToken, newWorkspaceId) => {
    localStorage.setItem('accessToken', newAccessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('workspaceId', newWorkspaceId);
    localStorage.setItem('user', JSON.stringify(userData));

    setUser(userData);
    setAccessToken(newAccessToken);
    setWorkspaceId(newWorkspaceId);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setAccessToken(null);
    setWorkspaceId(null);
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, workspaceId, isLoading, isAuthenticated, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
