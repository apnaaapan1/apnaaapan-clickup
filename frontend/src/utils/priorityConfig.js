export const priorityConfig = {
  urgent: { color: '#ef4444', label: 'Urgent' },
  high: { color: '#f59e0b', label: 'High' },
  medium: { color: '#facc15', label: 'Medium' },
  low: { color: '#9ca3af', label: 'Low' },
  none: { color: '#d1d5db', label: 'None' },
};

export const priorityOptions = ['urgent', 'high', 'medium', 'low', 'none'];

export function getPriorityConfig(priority) {
  return priorityConfig[priority] || priorityConfig.medium;
}
