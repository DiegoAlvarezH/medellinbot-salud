import 'server-only';
import { USER_AGENT } from '@/lib/config/site';

interface Entry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

/**
 * Memoizes an async loader in process memory for `ttlMs`.
 * Concurrent callers share one in-flight request, and a stale value is served
 * if a refresh fails, so a flaky upstream never blanks the UI.
 */
export async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expiresAt > now) return hit.value;

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const request = loader()
    .then((value) => {
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .catch((error: unknown) => {
      if (hit) return hit.value;
      throw error;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, request);
  return request;
}

/** fetch() with a hard timeout and a descriptive User-Agent (required by OSM/Overpass usage policies). */
export async function fetchJson<T>(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const { timeoutMs = 12000, headers, ...rest } = init;
  const response = await fetch(url, {
    ...rest,
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
      ...headers,
    },
  });
  if (!response.ok) {
    throw new Error(`${new URL(url).host} respondió ${response.status}`);
  }
  return (await response.json()) as T;
}
