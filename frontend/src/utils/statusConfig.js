export const statusOptions = [
  { value: 'todo', label: 'To do', group: 'Statuses', color: '#9ca3af' },
  { value: 'in_progress', label: 'In progress', group: 'Statuses', color: '#8b5cf6' },
  { value: 'in_review', label: 'In review', group: 'Statuses', color: '#3b82f6' },
  { value: 'done', label: 'Complete', group: 'Closed', color: '#22c55e' },
  { value: 'cancelled', label: 'Cancelled', group: 'Closed', color: '#6b7280' },
];

export function getStatusConfig(status) {
  return statusOptions.find((option) => option.value === status) || statusOptions[0];
}

export function getStatusGroups(options = statusOptions) {
  const groups = new Map();
  options.forEach((option) => {
    if (!groups.has(option.group)) groups.set(option.group, []);
    groups.get(option.group).push(option);
  });
  return Array.from(groups.entries());
}
