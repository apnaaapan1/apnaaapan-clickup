const storageKey = (workspaceId) =>
  workspaceId ? `sidebar_hidden_project_ids:${workspaceId}` : null;

export function getHiddenProjectIds(workspaceId) {
  const key = storageKey(workspaceId);
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function setHiddenProjectIds(workspaceId, ids) {
  const key = storageKey(workspaceId);
  if (!key) return;
  localStorage.setItem(key, JSON.stringify([...new Set(ids.map(String))]));
}

export function hideProjectFromSidebar(workspaceId, projectId) {
  const id = String(projectId);
  const next = new Set(getHiddenProjectIds(workspaceId));
  next.add(id);
  setHiddenProjectIds(workspaceId, [...next]);
  window.dispatchEvent(new Event('sidebar-spaces:changed'));
}

export function showProjectInSidebar(workspaceId, projectId) {
  const id = String(projectId);
  const next = getHiddenProjectIds(workspaceId).filter((x) => x !== id);
  setHiddenProjectIds(workspaceId, next);
  window.dispatchEvent(new Event('sidebar-spaces:changed'));
}
