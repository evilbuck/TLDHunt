import type { ParsedArgs, ValidationResult } from "./types";

export interface ParsedArgs {
  keywords: string[];
  tlds: string[];
  tldFile?: string;
  availableOnly: boolean;
  updateTld: boolean;
  jsonOutput: boolean;
  fileExists?: (path: string) => boolean;
}

export const DEFAULT_TLDS = [".com", ".net", ".io", ".ai"];

export function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {
    keywords: [],
    tlds: [],
    availableOnly: false,
    updateTld: false,
    jsonOutput: false,
  };
  
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    
    if (!arg.startsWith("-") && args.keywords.length === 0) {
      args.keywords.push(arg);
      i++;
      continue;
    }
    
    switch (arg) {
      case "-k":
      case "--keyword":
        if (argv[i + 1]) {
          args.keywords.push(argv[i + 1]);
          i++;
        }
        break;
        
      case "-K":
      case "--keywords":
        if (argv[i + 1]) {
          const keywords = argv[i + 1].split(",").map(k => k.trim());
          args.keywords.push(...keywords);
          i++;
        }
        break;
        
      case "-e":
      case "--tld":
        if (argv[i + 1]) {
          let tld = argv[i + 1].trim();
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
          args.tldFile = argv[i + 1];
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
    }
    
    i++;
  }
  
  return args;
}

export function validateArgs(args: ParsedArgs): ValidationResult {
  const tlds = args.tlds ?? [];
  
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