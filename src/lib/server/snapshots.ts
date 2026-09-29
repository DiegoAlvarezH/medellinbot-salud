import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Versioned JSON snapshots under data/snapshots/, produced by `pnpm data:sync`.
 * They let the app boot instantly and keep working when an upstream API is down.
 */
export interface Snapshot<T> {
  source: string;
  generatedAt: string;
  data: T;
}

const DIR = path.join(process.cwd(), 'data', 'snapshots');

export async function readSnapshot<T>(name: string): Promise<Snapshot<T> | null> {
  try {
    const raw = await fs.readFile(path.join(DIR, `${name}.json`), 'utf8');
    return JSON.parse(raw) as Snapshot<T>;
  } catch {
    return null;
  }
}

export function ageMs(snapshot: Snapshot<unknown>): number {
  return Date.now() - new Date(snapshot.generatedAt).getTime();
}

/**
 * Serves a snapshot while it is younger than `maxAgeMs`; otherwise tries the live loader
 * and falls back to the (stale) snapshot if the upstream fails.
 */
export async function snapshotFirst<T>(name: string, maxAgeMs: number, live: () => Promise<T>): Promise<{ data: T; generatedAt: string }> {
  const snapshot = await readSnapshot<T>(name);
  if (snapshot && ageMs(snapshot) < maxAgeMs) return { data: snapshot.data, generatedAt: snapshot.generatedAt };
  try {
    return { data: await live(), generatedAt: new Date().toISOString() };
  } catch (error) {
    if (snapshot) return { data: snapshot.data, generatedAt: snapshot.generatedAt };
    throw error;
  }
}
