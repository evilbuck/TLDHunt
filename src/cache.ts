import { Database } from "bun:sqlite";
import type { CachedResult } from "./types";

const DEFAULT_CACHE_PATH = `${process.env.HOME}/.tldhunt/cache.db`;
const CACHE_DIR = `${process.env.HOME}/.tldhunt`;

let db: Database | null = null;

export function getCachePath(): string {
  return DEFAULT_CACHE_PATH;
}

export function initCache(customPath?: string): Database {
  const path = customPath ?? DEFAULT_CACHE_PATH;
  
  if (db) {
    return db;
  }
  
  Bun.spawnSync(["mkdir", "-p", CACHE_DIR]);
  
  db = new Database(path);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS cache (
      domain TEXT PRIMARY KEY,
      available INTEGER NOT NULL,
      checked_at INTEGER NOT NULL,
      expires_at INTEGER
    )
  `);
  
  db.run(`CREATE INDEX IF NOT EXISTS idx_checked_at ON cache(checked_at)`);
  
  try {
    db.run(`ALTER TABLE cache ADD COLUMN expires_at INTEGER`);
  } catch {
  }
  
  return db;
}

export function getCachedResult(
  domain: string,
  ttlMs: number,
  database?: Database
): CachedResult | null {
  const dbInstance = database ?? db;
  
  if (!dbInstance) {
    return null;
  }
  
  interface DbRow {
    domain: string;
    available: number;
    checked_at: number;
    expires_at: number | null;
  }
  
  const stmt = dbInstance.query<DbRow, [string]>(
    "SELECT domain, available, checked_at, expires_at FROM cache WHERE domain = ?"
  );
  
  const result = stmt.get(domain);
  
  if (!result) {
    return null;
  }
  
  const now = Date.now();
  
  if (result.expires_at) {
    if (now > result.expires_at * 1000) {
      return null;
    }
  } else {
    const age = now - result.checked_at;
    if (age > ttlMs) {
      return null;
    }
  }
  
  return {
    domain: result.domain,
    available: result.available === 1,
    checkedAt: result.checked_at,
    expiresAt: result.expires_at,
  };
}

export function saveResult(
  domain: string,
  available: boolean,
  expiresAt: number | null,
  database?: Database
): void {
  const dbInstance = database ?? db;
  
  if (!dbInstance) {
    return;
  }
  
  const stmt = dbInstance.query(
    "INSERT OR REPLACE INTO cache (domain, available, checked_at, expires_at) VALUES (?, ?, ?, ?)"
  );
  
  stmt.run(domain, available ? 1 : 0, Date.now(), expiresAt);
}

export function clearCache(database?: Database): number {
  const dbInstance = database ?? db;
  
  if (!dbInstance) {
    return 0;
  }
  
  const result = dbInstance.run("DELETE FROM cache");
  return result.changes;
}

export function closeCache(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function getDefaultTtlMs(): number {
  return 60 * 24 * 60 * 60 * 1000;
}

export function hoursToMs(hours: number): number {
  return hours * 60 * 60 * 1000;
}