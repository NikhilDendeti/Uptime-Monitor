import { useCallback, useEffect, useState } from 'react';
import type { MonitoredUrlStatus } from '../api';
import { addUrl, deleteUrl, fetchUrls } from '../api';

const POLL_INTERVAL_MS = 5000;

interface UseMonitorsResult {
  monitors: MonitoredUrlStatus[];
  isInitialLoading: boolean;
  isOffline: boolean;
  isAdding: boolean;
  addError: string | null;
  add: (url: string) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export function useMonitors(): UseMonitorsResult {
  const [monitors, setMonitors] = useState<MonitoredUrlStatus[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchUrls();
      setMonitors(data);
      setIsOffline(false);
    } catch {
      setIsOffline(true);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const add = useCallback(
    async (url: string) => {
      setAddError(null);
      setIsAdding(true);
      try {
        await addUrl(url);
        await load();
      } catch (err) {
        setAddError(err instanceof Error ? err.message : 'Failed to add URL');
        throw err;
      } finally {
        setIsAdding(false);
      }
    },
    [load]
  );

  const remove = useCallback(async (id: number) => {
    setMonitors((prev) => prev.filter((m) => m.id !== id));
    try {
      await deleteUrl(id);
    } catch {
      await load();
    }
  }, [load]);

  return { monitors, isInitialLoading, isOffline, isAdding, addError, add, remove };
}
