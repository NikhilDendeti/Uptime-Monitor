import { Activity } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface">
          <Activity className="h-[18px] w-[18px] text-primary" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-text">Uptime Monitor</h1>
          <p className="text-sm text-text-secondary">
            Checks run every ~60 seconds. This page refreshes every 5 seconds.
          </p>
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
}
