#!/usr/bin/env bun
import { displayBanner } from "./banner";
import { parseArgs, validateArgs, DEFAULT_TLDS, type ParsedArgs } from "./cli";
import { checkDomain } from "./domain-checker";
import { updateTldList } from "./tld-updater";
import { formatResultsTable, countResults } from "./table-formatter";
import type { DomainResult, JsonOutput } from "./types";

const MAX_CONCURRENT = 30;

export async function loadTldsFromFile(
  path: string,
  reader?: (path: string) => Promise<string>
): Promise<string[]> {
  const fileReader = reader ?? defaultFileReader;
  const content = await fileReader(path);
  
  return content
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

async function defaultFileReader(path: string): Promise<string> {
  const file = Bun.file(path);
  return file.text();
}

export async function runWithConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];
  
  for (const task of tasks) {
    const p = task().then(result => {
      results.push(result);
    });
    executing.push(p);
    
    if (executing.length >= limit) {
      await Promise.race(executing);
      const completed = executing.filter(async p => {
        try {
          await p;
          return true;
        } catch {
          return true;
        }
      });
      executing.length = 0;
      for (const c of await Promise.all(completed)) {
        if (c) executing.push(Promise.resolve());
      }
    }
  }
  
  await Promise.all(executing);
  return results;
}

export async function main(argv: string[]): Promise<number> {
  const args = parseArgs(argv);
  
  if (!args.jsonOutput) {
    displayBanner();
  }
  
  if (args.updateTld) {
    console.log("Fetching TLD data from IANA...");
    const result = await updateTldList();
    console.log(`TLDs have been saved to ${result.file}.`);
    return 0;
  }
  
  const validation = validateArgs(args);
  if (!validation.valid) {
    console.error(validation.error);
    if (!args.jsonOutput) {
      usage();
    }
    return 1;
  }
  
  let tlds: string[];
  if (args.tldFile) {
    tlds = await loadTldsFromFile(args.tldFile);
  } else if (args.tlds.length > 0) {
    tlds = args.tlds;
  } else {
    tlds = DEFAULT_TLDS;
  }
  
  if (!args.jsonOutput) {
    console.log(`Checking ${args.keywords.length} keyword(s) against ${tlds.length} TLD(s)...\n`);
  }
  
  const tasks: (() => Promise<DomainResult>)[] = [];
  
  for (const keyword of args.keywords) {
    for (const tld of tlds) {
      const domain = `${keyword}${tld}`;
      tasks.push(() => checkDomain(domain));
    }
  }
  
  const results = await runWithConcurrencyLimit(tasks, MAX_CONCURRENT);
  
  if (args.jsonOutput) {
    let jsonResults: JsonOutput[] = results.map(r => ({
      domain: `${r.keyword}${r.tld}`,
      available: r.available,
    }));
    if (args.availableOnly) {
      jsonResults = jsonResults.filter(r => r.available);
    }
    console.log(JSON.stringify(jsonResults));
  } else {
    let finalResults = results;
    if (args.availableOnly) {
      finalResults = results.filter(r => r.available);
    }
    
    if (finalResults.length === 0) {
      console.log("No available domains found.");
    } else {
      console.log(formatResultsTable(finalResults));
      console.log();
      
      const counts = countResults(results);
      console.log(`Summary: ${counts.available} available, ${counts.taken} taken`);
    }
  }
  
  return 0;
}

function usage(): void {
  console.log(`Usage: tldhunt <keyword> [-e <tld> | -E <tld-file>] [-x] [-j] [--update-tld]
Example: tldhunt linuxsec
       : tldhunt linuxsec -e .com
       : tldhunt linuxsec -j
       : tldhunt --update-tld`);
}

if (import.meta.main) {
  const args = Bun.argv.slice(2);
  const exitCode = await main(args);
  process.exit(exitCode);
}