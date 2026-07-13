export type MonitorStatus = 'up' | 'down' | 'pending';

export interface MonitoredUrlStatus {
  id: number;
  url: string;
  createdAt: string;
  status: MonitorStatus;
  statusCode: number | null;
  responseMs: number | null;
  lastCheckedAt: string | null;
  errorMessage: string | null;
}

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export async function fetchUrls(): Promise<MonitoredUrlStatus[]> {
  const res = await fetch(`${API_BASE}/urls`);
  if (!res.ok) throw new Error('Failed to fetch urls');
  return res.json();
}

export async function addUrl(url: string): Promise<void> {
  const res = await fetch(`${API_BASE}/urls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to add url');
  }
}

export async function deleteUrl(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/urls/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete url');
}
