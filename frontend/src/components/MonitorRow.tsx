import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import type { MonitoredUrlStatus } from '../api';
import { IconButton } from './ui/IconButton';
import { StatusBadge } from './ui/StatusBadge';

const rowMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.15, ease: 'easeInOut' as const },
};

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

interface MonitorRowProps {
  monitor: MonitoredUrlStatus;
  onDelete: (id: number) => void;
}

export function MonitorTableRow({ monitor, onDelete }: MonitorRowProps) {
  return (
    <motion.tr {...rowMotion} className="border-b border-border last:border-0 hover:bg-hover">
      <td className="max-w-[280px] truncate px-4 py-3 text-sm text-text" title={monitor.url}>
        {monitor.url}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={monitor.status} />
      </td>
      <td className="px-4 py-3 text-sm text-text-secondary">{monitor.statusCode ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-text-secondary">
        {monitor.responseMs !== null ? `${monitor.responseMs} ms` : '—'}
      </td>
      <td className="px-4 py-3 text-sm text-text-secondary">{formatTime(monitor.lastCheckedAt)}</td>
      <td className="px-2 py-3 text-right">
        <IconButton label={`Stop monitoring ${monitor.url}`} tone="danger" onClick={() => onDelete(monitor.id)}>
          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
        </IconButton>
      </td>
    </motion.tr>
  );
}

export function MonitorCard({ monitor, onDelete }: MonitorRowProps) {
  return (
    <motion.div
      {...rowMotion}
      className="flex flex-col gap-3 border-b border-border p-4 last:border-0"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-medium text-text" title={monitor.url}>
          {monitor.url}
        </p>
        <IconButton label={`Stop monitoring ${monitor.url}`} tone="danger" onClick={() => onDelete(monitor.id)}>
          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
        </IconButton>
      </div>
      <div className="flex items-center justify-between text-sm">
        <StatusBadge status={monitor.status} />
        <span className="text-text-secondary">
          {monitor.responseMs !== null ? `${monitor.responseMs} ms` : '—'}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>{monitor.statusCode ? `Status ${monitor.statusCode}` : 'No response'}</span>
        <span>{formatTime(monitor.lastCheckedAt)}</span>
      </div>
    </motion.div>
  );
}
