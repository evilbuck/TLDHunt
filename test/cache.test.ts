import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { Database } from "bun:sqlite";
import {
  initCache,
  getCachedResult,
  saveResult,
  clearCache,
  closeCache,
  hoursToMs,
  getDefaultTtlMs,
} from "../src/cache";

const TEST_DB_PATH = "/tmp/tldhunt-test-cache.db";

describe("cache", () => {
  let db: Database;

  beforeEach(() => {
    db = new Database(TEST_DB_PATH);
    db.run(`
      CREATE TABLE IF NOT EXISTS cache (
        domain TEXT PRIMARY KEY,
        available INTEGER NOT NULL,
        checked_at INTEGER NOT NULL
      )
    `);
    db.run(`DELETE FROM cache`);
  });

  afterEach(() => {
    db.run(`DELETE FROM cache`);
    db.close();
    closeCache();
  });

  describe("saveResult and getCachedResult", () => {
    test("saves and retrieves a result", () => {
      saveResult("example.com", false, db);
      
      const result = getCachedResult("example.com", 3600000, db);
      
      expect(result).not.toBeNull();
      expect(result?.domain).toBe("example.com");
      expect(result?.available).toBe(false);
    });

    test("returns null for non-existent domain", () => {
      const result = getCachedResult("nonexistent.com", 3600000, db);
      
      expect(result).toBeNull();
    });

    test("returns null for expired cache entry", () => {
      const pastTime = Date.now() - 7200000;
      db.run(
        "INSERT INTO cache (domain, available, checked_at) VALUES (?, ?, ?)",
        ["expired.com", 1, pastTime]
      );
      
      const result = getCachedResult("expired.com", 3600000, db);
      
      expect(result).toBeNull();
    });

    test("returns result for non-expired entry", () => {
      const recentTime = Date.now() - 1800000;
      db.run(
        "INSERT INTO cache (domain, available, checked_at) VALUES (?, ?, ?)",
        ["recent.com", 1, recentTime]
      );
      
      const result = getCachedResult("recent.com", 3600000, db);
      
      expect(result).not.toBeNull();
      expect(result?.available).toBe(true);
    });

    test("overwrites existing entry on save", () => {
      saveResult("example.com", false, db);
      saveResult("example.com", true, db);
      
      const result = getCachedResult("example.com", 3600000, db);
      
      expect(result?.available).toBe(true);
    });
  });

  describe("clearCache", () => {
    test("clears all cached entries", () => {
      saveResult("example.com", false, db);
      saveResult("example.org", true, db);
      
      const count = clearCache(db);
      
      expect(count).toBe(2);
      expect(getCachedResult("example.com", 3600000, db)).toBeNull();
      expect(getCachedResult("example.org", 3600000, db)).toBeNull();
    });

    test("returns 0 when cache is empty", () => {
      const count = clearCache(db);
      
      expect(count).toBe(0);
    });
  });

  describe("hoursToMs", () => {
    test("converts hours to milliseconds", () => {
      expect(hoursToMs(1)).toBe(3600000);
      expect(hoursToMs(24)).toBe(86400000);
      expect(hoursToMs(1440)).toBe(5184000000);
    });
  });

  describe("getDefaultTtlMs", () => {
    test("returns 60 days in milliseconds", () => {
      const expected = 60 * 24 * 60 * 60 * 1000;
      expect(getDefaultTtlMs()).toBe(expected);
    });
  });
});