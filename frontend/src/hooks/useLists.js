import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function useLists(projectId) {
  const { workspaceId } = useAuth();
  const [lists, setLists] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    if (!workspaceId || !projectId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/workspaces/${workspaceId}/projects/${projectId}`);
      const fetchedProject = res.data?.project || null;
      setProject(fetchedProject);
      setLists(fetchedProject?.lists || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load space');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, projectId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const onListsChanged = () => refetch();
    window.addEventListener('lists:changed', onListsChanged);
    return () => window.removeEventListener('lists:changed', onListsChanged);
  }, [refetch]);

  useEffect(() => {
    const onProjectsChanged = () => refetch();
    window.addEventListener('projects:changed', onProjectsChanged);
    return () => window.removeEventListener('projects:changed', onProjectsChanged);
  }, [refetch]);

  return { lists, project, loading, error, refetch };
}
