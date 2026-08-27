export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDueLabel(expectedReturn: number | undefined, now: number): string {
  if (!expectedReturn) return 'No due date';
  const days = Math.round((expectedReturn - now) / (1000 * 60 * 60 * 24));
  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}
