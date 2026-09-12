export interface DeadlineStatus {
  hasDeadline: boolean;
  formattedDate: string;
  daysRemaining: number;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueSoon: boolean;
  label: string;
  badgeVariant: 'destructive' | 'default' | 'secondary' | 'outline';
  badgeClass: string;
}

/**
 * Format a YYYY-MM-DD or ISO date string into human-readable format, e.g. "Oct 31, 2026"
 */
export function formatDeadlineDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Calculates deadline status including days remaining, overdue status, and styling badges.
 */
export function getDeadlineStatus(deadlineStr?: string): DeadlineStatus {
  if (!deadlineStr) {
    return {
      hasDeadline: false,
      formattedDate: '',
      daysRemaining: 0,
      isOverdue: false,
      isDueToday: false,
      isDueSoon: false,
      label: 'No deadline set',
      badgeVariant: 'outline',
      badgeClass: 'text-muted-foreground border-border/60',
    };
  }

  const formattedDate = formatDeadlineDate(deadlineStr);
  const cleanDateStr = deadlineStr.split('T')[0];
  const parts = cleanDateStr.split('-');
  
  const targetDate = parts.length === 3
    ? new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 23, 59, 59)
    : new Date(deadlineStr);

  const now = new Date();
  // Strip time from now for fair day-boundary comparisons
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const targetMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);

  const diffMs = targetMidnight.getTime() - todayMidnight.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const isDueToday = diffDays === 0;
  const isOverdue = diffDays < 0;
  const isDueSoon = diffDays > 0 && diffDays <= 7;

  let label: string;
  let badgeVariant: 'destructive' | 'default' | 'secondary' | 'outline' = 'default';
  let badgeClass: string;

  if (isDueToday) {
    label = 'Due today';
    badgeVariant = 'secondary';
    badgeClass = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold';
  } else if (isOverdue) {
    const overdueDays = Math.abs(diffDays);
    label = `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`;
    badgeVariant = 'destructive';
    badgeClass = 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 font-semibold';
  } else if (isDueSoon) {
    label = `${diffDays} day${diffDays === 1 ? '' : 's'} left`;
    badgeVariant = 'secondary';
    badgeClass = 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30 font-medium';
  } else {
    label = `${diffDays} days left`;
    badgeVariant = 'outline';
    badgeClass = 'bg-primary/10 text-primary border-primary/25 font-medium';
  }

  return {
    hasDeadline: true,
    formattedDate,
    daysRemaining: diffDays,
    isOverdue,
    isDueToday,
    isDueSoon,
    label,
    badgeVariant,
    badgeClass,
  };
}

/**
 * Returns preset deadline dates formatted as YYYY-MM-DD
 */
export function getPresetDeadline(
  preset: '1week' | '2weeks' | 'endOfMonth' | '3weeks' | 'endOfQuarter'
): string {
  const now = new Date();

  switch (preset) {
    case '1week': {
      const d = new Date(now);
      d.setDate(d.getDate() + 7);
      return toIsoDateString(d);
    }
    case '2weeks': {
      const d = new Date(now);
      d.setDate(d.getDate() + 14);
      return toIsoDateString(d);
    }
    case '3weeks': {
      const d = new Date(now);
      d.setDate(d.getDate() + 21);
      return toIsoDateString(d);
    }
    case 'endOfMonth': {
      const d = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return toIsoDateString(d);
    }
    case 'endOfQuarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      const d = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
      return toIsoDateString(d);
    }
    default:
      return toIsoDateString(now);
  }
}

function toIsoDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
