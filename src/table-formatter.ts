import type { DomainResult } from "./types";

export function formatResultsTable(results: DomainResult[]): string {
  if (results.length === 0) {
    return "No results to display.";
  }
  
  const tlds = [...new Set(results.map(r => r.tld))].sort();
  const keywords = [...new Set(results.map(r => r.keyword))].sort();
  
  const resultMatrix = new Map<string, Map<string, boolean>>();
  
  for (const result of results) {
    if (!resultMatrix.has(result.keyword)) {
      resultMatrix.set(result.keyword, new Map());
    }
    resultMatrix.get(result.keyword)!.set(result.tld, result.available);
  }
  
  const columnWidths = calculateColumnWidths(keywords, tlds);
  
  const lines: string[] = [];
  
  lines.push(formatHeaderRow(tlds, columnWidths));
  lines.push(formatSeparatorRow(tlds, columnWidths));
  
  for (const keyword of keywords) {
    lines.push(formatDataRow(keyword, tlds, resultMatrix, columnWidths));
  }
  
  lines.push(formatBottomRow(tlds, columnWidths));
  
  return lines.join("\n");
}

function calculateColumnWidths(keywords: string[], tlds: string[]): { domain: number; tlds: number[] } {
  const maxKeywordLength = Math.max(9, ...keywords.map(k => k.length));
  const tldWidths = tlds.map(t => Math.max(t.length, 3));
  
  return { domain: maxKeywordLength, tlds: tldWidths };
}

function formatHeaderRow(tlds: string[], widths: { domain: number; tlds: number[] }): string {
  const borderParts: string[] = [];
  
  borderParts.push("┌" + "─".repeat(widths.domain + 2) + "┬");
  
  const tldParts: string[] = [];
  for (let i = 0; i < tlds.length; i++) {
    tldParts.push("─".repeat(widths.tlds[i] + 2));
  }
  borderParts.push(tldParts.join("┬"));
  borderParts.push("┐");
  
  const borderLine = borderParts.join("");
  
  const row: string[] = [];
  row.push("│ " + "Domain".padEnd(widths.domain) + " │");
  
  for (let i = 0; i < tlds.length; i++) {
    row.push(" " + tlds[i].padEnd(widths.tlds[i]) + " │");
  }
  
  const contentLine = row.join("");
  
  return borderLine + "\n" + contentLine;
}

function formatSeparatorRow(tlds: string[], widths: { domain: number; tlds: number[] }): string {
  const parts: string[] = [];
  
  parts.push("├" + "─".repeat(widths.domain + 2) + "┼");
  
  const tldParts: string[] = [];
  for (let i = 0; i < tlds.length; i++) {
    tldParts.push("─".repeat(widths.tlds[i] + 2));
  }
  parts.push(tldParts.join("┼"));
  parts.push("┤");
  
  return parts.join("");
}

function formatDataRow(
  keyword: string,
  tlds: string[],
  matrix: Map<string, Map<string, boolean>>,
  widths: { domain: number; tlds: number[] }
): string {
  const row: string[] = [];
  
  row.push("│ " + keyword.padEnd(widths.domain) + " │");
  
  const keywordResults = matrix.get(keyword)!;
  
  for (let i = 0; i < tlds.length; i++) {
    const available = keywordResults.get(tlds[i]);
    const symbol = available ? "✓" : "✗";
    row.push(" " + symbol.padEnd(widths.tlds[i]) + " │");
  }
  
  return row.join("");
}

function formatBottomRow(tlds: string[], widths: { domain: number; tlds: number[] }): string {
  const parts: string[] = [];
  
  parts.push("└" + "─".repeat(widths.domain + 2) + "┴");
  
  const tldParts: string[] = [];
  for (let i = 0; i < tlds.length; i++) {
    tldParts.push("─".repeat(widths.tlds[i] + 2));
  }
  parts.push(tldParts.join("┴"));
  parts.push("┘");
  
  return parts.join("");
}

export function countResults(results: DomainResult[]): { available: number; taken: number } {
  let available = 0;
  let taken = 0;
  
  for (const result of results) {
    if (result.available) {
      available++;
    } else {
      taken++;
    }
  }
  
  return { available, taken };
}