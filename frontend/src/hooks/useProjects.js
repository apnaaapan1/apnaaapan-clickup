import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function useProjects() {
  const { workspaceId } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    if (!workspaceId) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/workspaces/${workspaceId}/projects`);
      setProjects(res.data?.projects || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch spaces');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { projects, loading, error, refetch };
}
