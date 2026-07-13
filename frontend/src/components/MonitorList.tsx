import { Globe2 } from 'lucide-react';
import type { MonitoredUrlStatus } from '../api';
import { MonitorCard, MonitorTableRow } from './MonitorRow';
import { EmptyState } from './ui/EmptyState';
import { Skeleton } from './ui/Skeleton';

const COLUMNS = ['URL', 'Status', 'Code', 'Response', 'Last checked', ''];

function TableSkeleton() {
  return (
    <>
      <table className="hidden w-full md:table">
        <tbody>
          {[0, 1, 2].map((i) => (
            <tr key={i} className="border-b border-border last:border-0">
              {COLUMNS.map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-3">
                  <Skeleton className="h-4 w-full max-w-[140px]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-col md:hidden">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-3 border-b border-border p-4 last:border-0">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </>
  );
}

interface MonitorListProps {
  monitors: MonitoredUrlStatus[];
  isInitialLoading: boolean;
  onDelete: (id: number) => void;
}

export function MonitorList({ monitors, isInitialLoading, onDelete }: MonitorListProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-elevated">
      {isInitialLoading ? (
        <TableSkeleton />
      ) : monitors.length === 0 ? (
        <EmptyState
          icon={Globe2}
          title="No URLs monitored yet"
          description="Add a URL above to start checking its uptime and response time every minute."
        />
      ) : (
        <>
          <table className="hidden w-full md:table">
            <thead>
              <tr className="border-b border-border">
                {COLUMNS.map((col) => (
                  <th
                    key={col}
                    scope="col"
                    className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-text-muted"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monitors.map((monitor) => (
                <MonitorTableRow key={monitor.id} monitor={monitor} onDelete={onDelete} />
              ))}
            </tbody>
          </table>

          <div className="flex flex-col md:hidden">
            {monitors.map((monitor) => (
              <MonitorCard key={monitor.id} monitor={monitor} onDelete={onDelete} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
