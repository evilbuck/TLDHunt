import type { DomainResult } from "./types";

export const REGISTRATION_SIGNATURES = [
  "Name Server",
  "nserver",
  "nameservers",
  "status: active",
] as const;

export function isRegistered(whoisOutput: string): boolean {
  const lowerOutput = whoisOutput.toLowerCase();
  
  for (const signature of REGISTRATION_SIGNATURES) {
    if (lowerOutput.includes(signature.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

const EXPIRATION_PATTERNS = [
  /expiry\s*(?:date)?[:\s]*(\d{4}[-/]\d{2}[-/]\d{2})/i,
  /expiration\s*(?:date)?[:\s]*(\d{4}[-/]\d{2}[-/]\d{2})/i,
  /expires?[:\s]*(\d{4}[-/]\d{2}[-/]\d{2})/i,
  /expire[:\s]*(\d{4}[-/]\d{2}[-/]\d{2})/i,
  /expiry\s*(?:date)?[:\s]*(\d{2}[-/]\d{2}[-/]\d{4})/i,
  /expiration\s*(?:date)?[:\s]*(\d{2}[-/]\d{2}[-/]\d{4})/i,
  /expires?[:\s]*(\d{2}[-/]\d{2}[-/]\d{4})/i,
];

export function parseExpiration(whoisOutput: string): number | null {
  for (const pattern of EXPIRATION_PATTERNS) {
    const match = whoisOutput.match(pattern);
    if (match && match[1]) {
      const dateStr = match[1];
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return Math.floor(parsed.getTime() / 1000);
      }
    }
  }
  return null;
}

export function parseDomain(domain: string): { keyword: string; tld: string } {
  const lastDotIndex = domain.lastIndexOf(".");
  
  if (lastDotIndex === -1) {
    return { keyword: domain, tld: "" };
  }
  
  const keyword = domain.substring(0, lastDotIndex);
  const tld = "." + domain.substring(lastDotIndex + 1);
  
  return { keyword, tld };
}

export type WhoisExecutor = (domain: string) => Promise<string>;

export async function checkDomain(
  domain: string,
  executor?: WhoisExecutor
): Promise<DomainResult> {
  const { keyword, tld } = parseDomain(domain);
  
  const whoisExecutor = executor ?? executeWhois;
  
  try {
    const output = await whoisExecutor(domain);
    const available = !isRegistered(output);
    const expiresAt = available ? null : parseExpiration(output);
    
    return { keyword, tld, available, expiresAt };
  } catch {
    return { keyword, tld, available: true, expiresAt: null };
  }
}

async function executeWhois(domain: string): Promise<string> {
  const proc = Bun.spawn(["whois", domain], {
    stdout: "pipe",
    stderr: "pipe",
  });
  
  const stdout = await new Response(proc.stdout).text();
  await proc.exited;
  
  return stdout;
}