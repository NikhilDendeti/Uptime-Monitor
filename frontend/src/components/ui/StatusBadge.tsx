import type { MonitorStatus } from '../../api';
import { cn } from '../../lib/cn';

const STATUS_CONFIG: Record<MonitorStatus, { label: string; dot: string; text: string; bg: string }> = {
  up: { label: 'Up', dot: 'bg-success', text: 'text-success', bg: 'bg-success-bg' },
  down: { label: 'Down', dot: 'bg-danger', text: 'text-danger', bg: 'bg-danger-bg' },
  pending: { label: 'Pending', dot: 'bg-text-muted', text: 'text-text-secondary', bg: 'bg-surface' },
};

export function StatusBadge({ status }: { status: MonitorStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs font-medium',
        config.text,
        config.bg
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} aria-hidden="true" />
      {config.label}
    </span>
  );
}
