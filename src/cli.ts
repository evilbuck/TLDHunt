import type { ValidationResult } from "./types";

export interface ParsedArgs {
  keywords: string[];
  tlds: string[];
  tldFile?: string;
  availableOnly: boolean;
  updateTld: boolean;
  jsonOutput: boolean;
  fileExists?: (path: string) => boolean;
  noCache: boolean;
  clearCache: boolean;
  cacheTtl: number;
}

export const DEFAULT_TLDS = [".com", ".net", ".io", ".ai"];

export function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {
    keywords: [],
    tlds: [],
    availableOnly: false,
    updateTld: false,
    jsonOutput: false,
    noCache: false,
    clearCache: false,
    cacheTtl: 1440,
  };
  
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    
    if (!arg) {
      i++;
      continue;
    }
    
    if (!arg.startsWith("-") && args.keywords.length === 0) {
      args.keywords.push(arg);
      i++;
      continue;
    }
    
    switch (arg) {
      case "-k":
      case "--keyword":
        if (argv[i + 1]) {
          args.keywords.push(argv[i + 1] as string);
          i++;
        }
        break;
        
      case "-K":
      case "--keywords":
        if (argv[i + 1]) {
          const kw = argv[i + 1] as string;
          const keywords = kw.split(",").map(k => k.trim());
          args.keywords.push(...keywords);
          i++;
        }
        break;
        
      case "-e":
      case "--tld":
        if (argv[i + 1]) {
          let tld = (argv[i + 1] as string).trim();
          if (!tld.startsWith(".")) {
            tld = "." + tld;
          }
          args.tlds.push(tld);
          args.tldFile = undefined;
          i++;
        }
        break;
        
      case "-E":
      case "--tld-file":
        if (argv[i + 1]) {
          args.tldFile = argv[i + 1] as string;
          i++;
        }
        break;
        
      case "-x":
      case "--available-only":
        args.availableOnly = true;
        break;
        
      case "-j":
      case "--json":
        args.jsonOutput = true;
        break;
        
      case "--update-tld":
        args.updateTld = true;
        break;
        
      case "--no-cache":
        args.noCache = true;
        break;
        
      case "--clear-cache":
        args.clearCache = true;
        break;
        
      case "--cache-ttl":
        if (argv[i + 1]) {
          const ttl = parseInt(argv[i + 1] as string, 10);
          if (!isNaN(ttl) && ttl > 0) {
            args.cacheTtl = ttl;
          }
          i++;
        }
        break;
    }
    
    i++;
  }
  
  return args;
}

export function validateArgs(args: ParsedArgs): ValidationResult {
  const tlds = args.tlds ?? [];
  
  if (args.clearCache) {
    if (args.keywords.length > 0 || tlds.length > 0 || args.availableOnly || args.updateTld) {
      return { valid: false, error: "--clear-cache cannot be used with other flags." };
    }
    return { valid: true };
  }
  
  if (args.updateTld) {
    if (args.keywords.length > 0 || tlds.length > 0 || args.availableOnly) {
      return { valid: false, error: "--update-tld cannot be used with other flags." };
    }
    return { valid: true };
  }
  
  if (args.keywords.length === 0) {
    return { valid: false, error: "Keyword is required." };
  }
  
  if (tlds.length > 0 && args.tldFile) {
    return { valid: false, error: "You can only specify one of -e or -E options." };
  }
  
  if (args.tldFile) {
    const existsFn = args.fileExists ?? defaultFileExists;
    if (!existsFn(args.tldFile)) {
      return { valid: false, error: `TLD file ${args.tldFile} not found.` };
    }
  }
  
  return { valid: true };
}

function defaultFileExists(path: string): boolean {
  try {
    Bun.file(path).size;
    return true;
  } catch {
    return false;
  }
}