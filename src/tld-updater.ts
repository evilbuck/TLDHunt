import type { UpdateResult } from "./types";

export const TLD_URL = "https://data.iana.org/TLD/tlds-alpha-by-domain.txt";

export type Fetcher = () => Promise<string>;
export type Writer = (path: string, content: string) => void;

export function parseTldList(rawContent: string): string[] {
  const lines = rawContent.split("\n");
  const tlds: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.length === 0) continue;
    if (trimmed.startsWith("#")) continue;
    
    const lowercase = trimmed.toLowerCase();
    const withDot = lowercase.startsWith(".") ? lowercase : "." + lowercase;
    tlds.push(withDot);
  }
  
  return tlds;
}

export async function updateTldList(
  fetcher?: Fetcher,
  writer?: Writer,
  filePath?: string
): Promise<UpdateResult> {
  const file = filePath ?? "tlds.txt";
  
  const dataFetcher = fetcher ?? defaultFetcher;
  const dataWriter = writer ?? defaultWriter;
  
  const rawContent = await dataFetcher();
  const tlds = parseTldList(rawContent);
  
  const content = tlds.join("\n") + "\n";
  dataWriter(file, content);
  
  return { count: tlds.length, file };
}

async function defaultFetcher(): Promise<string> {
  const response = await fetch(TLD_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch TLD list: ${response.statusText}`);
  }
  return response.text();
}

function defaultWriter(path: string, content: string): void {
  Bun.write(path, content);
}