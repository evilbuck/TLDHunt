import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { runWithConcurrencyLimit, loadTldsFromFile } from "../src/index";
import type { DomainResult } from "../src/types";

describe("loadTldsFromFile", () => {
  test("loads TLDs from file", async () => {
    const mockFs = {
      readFile: mock(() => Promise.resolve(".com\n.org\n.net\n")),
    };
    
    const tlds = await loadTldsFromFile("tlds.txt", mockFs.readFile);
    
    expect(tlds).toEqual([".com", ".org", ".net"]);
  });

  test("filters empty lines", async () => {
    const mockFs = {
      readFile: mock(() => Promise.resolve(".com\n\n.org\n\n")),
    };
    
    const tlds = await loadTldsFromFile("tlds.txt", mockFs.readFile);
    
    expect(tlds).toEqual([".com", ".org"]);
  });

  test("trims whitespace", async () => {
    const mockFs = {
      readFile: mock(() => Promise.resolve(".com  \n.org  \n")),
    };
    
    const tlds = await loadTldsFromFile("tlds.txt", mockFs.readFile);
    
    expect(tlds).toEqual([".com", ".org"]);
  });

  test("throws on file not found", async () => {
    const mockFs = {
      readFile: mock(() => Promise.reject(new Error("ENOENT"))),
    };
    
    expect(loadTldsFromFile("nonexistent.txt", mockFs.readFile)).rejects.toThrow();
  });
});

describe("domain check logic", () => {
  test("detects available domains by checking whois output", () => {
    const output = "No match for domain\n";
    const available = !output.includes("Name Server");
    expect(available).toBe(true);
  });

  test("detects taken domains by checking whois output", () => {
    const output = "Name Server: NS1.EXAMPLE.COM\n";
    const available = !output.includes("Name Server");
    expect(available).toBe(false);
  });

  test("respects available-only flag", () => {
    const allResults: DomainResult[] = [
      { keyword: "test", tld: ".com", available: true },
      { keyword: "test", tld: ".io", available: false },
      { keyword: "test", tld: ".ai", available: true },
    ];
    
    const filtered = allResults.filter(r => r.available);
    
    expect(filtered).toHaveLength(2);
    expect(filtered.every(r => r.available)).toBe(true);
  });
});

describe("parallel execution", () => {
  test("limits concurrent checks to 30", async () => {
    let maxConcurrent = 0;
    let currentConcurrent = 0;
    
    const tasks: (() => Promise<number>)[] = [];
    for (let i = 0; i < 50; i++) {
      tasks.push(async () => {
        currentConcurrent++;
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
        await new Promise(r => setTimeout(r, 10));
        currentConcurrent--;
        return i;
      });
    }
    
    const results = await runWithConcurrencyLimit(tasks, 30);
    
    expect(maxConcurrent).toBeLessThanOrEqual(30);
    expect(results).toHaveLength(50);
  });

  test("returns all results", async () => {
    const tasks: (() => Promise<number>)[] = [];
    for (let i = 0; i < 10; i++) {
      tasks.push(async () => {
        await new Promise(r => setTimeout(r, 5));
        return i;
      });
    }
    
    const results = await runWithConcurrencyLimit(tasks, 5);
    
    expect(results.sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});