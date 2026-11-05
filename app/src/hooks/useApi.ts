import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';

export function useApi() {
  const serverUrl = useAppStore((s) => s.serverUrl);

  return useMemo(() => {
    async function get<T>(path: string): Promise<T> {
      const res = await fetch(`${serverUrl}${path}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<T>;
    }

    async function post<T>(path: string, body?: unknown): Promise<T> {
      const res = await fetch(`${serverUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const d = await res.json(); if (d?.error) msg = d.error; } catch {}
        throw new Error(msg);
      }
      if (res.status === 204) return undefined as T;
      return res.json() as Promise<T>;
    }

    async function put<T>(path: string, body: unknown): Promise<T> {
      const res = await fetch(`${serverUrl}${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<T>;
    }

    async function del(path: string): Promise<void> {
      const res = await fetch(`${serverUrl}${path}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }

    return { get, post, put, del };
  }, [serverUrl]);
}
