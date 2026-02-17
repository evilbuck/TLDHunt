import { describe, test, expect } from "bun:test";
import { formatResultsTable, countResults, type DomainResult } from "../src/table-formatter";

describe("formatResultsTable", () => {
  const createResult = (keyword: string, tld: string, available: boolean): DomainResult => ({
    keyword,
    tld,
    available,
  });

  test("formats single keyword with multiple TLDs", () => {
    const results: DomainResult[] = [
      createResult("linuxsec", ".com", false),
      createResult("linuxsec", ".io", true),
      createResult("linuxsec", ".ai", false),
    ];
    
    const table = formatResultsTable(results);
    
    expect(table).toContain("Domain");
    expect(table).toContain(".com");
    expect(table).toContain(".io");
    expect(table).toContain(".ai");
    expect(table).toContain("linuxsec");
    expect(table).toContain("✓");
    expect(table).toContain("✗");
  });

  test("formats multiple keywords with multiple TLDs", () => {
    const results: DomainResult[] = [
      createResult("linuxsec", ".com", false),
      createResult("linuxsec", ".io", true),
      createResult("myproject", ".com", true),
      createResult("myproject", ".io", false),
    ];
    
    const table = formatResultsTable(results);
    
    expect(table).toContain("linuxsec");
    expect(table).toContain("myproject");
  });

  test("uses checkmark for available domains", () => {
    const results: DomainResult[] = [
      createResult("test", ".com", true),
    ];
    
    const table = formatResultsTable(results);
    
    expect(table).toContain("✓");
    expect(table).not.toContain("✗");
  });

  test("uses X for taken domains", () => {
    const results: DomainResult[] = [
      createResult("test", ".com", false),
    ];
    
    const table = formatResultsTable(results);
    
    expect(table).toContain("✗");
    expect(table).not.toContain("✓");
  });

  test("orders TLDs alphabetically in header", () => {
    const results: DomainResult[] = [
      createResult("test", ".io", true),
      createResult("test", ".com", false),
      createResult("test", ".ai", true),
    ];
    
    const table = formatResultsTable(results);
    const lines = table.split("\n");
    const headerLine = lines.find(l => l.includes(".ai") && l.includes(".com") && l.includes(".io"));
    
    expect(headerLine).toBeDefined();
    const aiIndex = headerLine!.indexOf(".ai");
    const comIndex = headerLine!.indexOf(".com");
    const ioIndex = headerLine!.indexOf(".io");
    
    expect(aiIndex).toBeLessThan(comIndex);
    expect(comIndex).toBeLessThan(ioIndex);
  });

  test("orders keywords alphabetically in rows", () => {
    const results: DomainResult[] = [
      createResult("zebra", ".com", true),
      createResult("alpha", ".com", true),
      createResult("beta", ".com", true),
    ];
    
    const table = formatResultsTable(results);
    const lines = table.split("\n");
    const dataLines = lines.filter(l => l.includes("zebra") || l.includes("alpha") || l.includes("beta"));
    
    expect(dataLines.length).toBe(3);
    expect(dataLines[0]).toContain("alpha");
    expect(dataLines[1]).toContain("beta");
    expect(dataLines[2]).toContain("zebra");
  });

  test("handles empty results", () => {
    const table = formatResultsTable([]);
    
    expect(table).toBe("No results to display.");
  });

  test("creates proper table structure with borders", () => {
    const results: DomainResult[] = [
      createResult("test", ".com", true),
    ];
    
    const table = formatResultsTable(results);
    
    expect(table).toContain("┌");
    expect(table).toContain("┬");
    expect(table).toContain("├");
    expect(table).toContain("┼");
    expect(table).toContain("└");
    expect(table).toContain("┴");
  });
});

describe("countResults", () => {
  test("counts available and taken domains", () => {
    const results: DomainResult[] = [
      { keyword: "test", tld: ".com", available: true },
      { keyword: "test", tld: ".io", available: false },
      { keyword: "test", tld: ".ai", available: true },
      { keyword: "test", tld: ".org", available: false },
    ];
    
    const counts = countResults(results);
    
    expect(counts.available).toBe(2);
    expect(counts.taken).toBe(2);
  });

  test("returns zeros for empty results", () => {
    const counts = countResults([]);
    
    expect(counts.available).toBe(0);
    expect(counts.taken).toBe(0);
  });

  test("counts all available", () => {
    const results: DomainResult[] = [
      { keyword: "test", tld: ".com", available: true },
      { keyword: "test", tld: ".io", available: true },
    ];
    
    const counts = countResults(results);
    
    expect(counts.available).toBe(2);
    expect(counts.taken).toBe(0);
  });

  test("counts all taken", () => {
    const results: DomainResult[] = [
      { keyword: "test", tld: ".com", available: false },
      { keyword: "test", tld: ".io", available: false },
    ];
    
    const counts = countResults(results);
    
    expect(counts.available).toBe(0);
    expect(counts.taken).toBe(2);
  });
});