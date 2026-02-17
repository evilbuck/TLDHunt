#!/usr/bin/env bun
import { displayBanner } from "./banner";
import { parseArgs, validateArgs, type ParsedArgs } from "./cli";
import { checkDomain } from "./domain-checker";
import { updateTldList } from "./tld-updater";
import { formatResultsTable, countResults } from "./table-formatter";
import type { DomainResult } from "./types";

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
  
  displayBanner();
  
  if (args.updateTld) {
    console.log("Fetching TLD data from IANA...");
    const result = await updateTldList();
    console.log(`TLDs have been saved to ${result.file}.`);
    return 0;
  }
  
  const validation = validateArgs(args);
  if (!validation.valid) {
    console.error(validation.error);
    usage();
    return 1;
  }
  
  let tlds: string[];
  if (args.tldFile) {
    tlds = await loadTldsFromFile(args.tldFile);
  } else {
    tlds = args.tlds;
  }
  
  console.log(`Checking ${args.keywords.length} keyword(s) against ${tlds.length} TLD(s)...\n`);
  
  const tasks: (() => Promise<DomainResult>)[] = [];
  
  for (const keyword of args.keywords) {
    for (const tld of tlds) {
      const domain = `${keyword}${tld}`;
      tasks.push(() => checkDomain(domain));
    }
  }
  
  const results = await runWithConcurrencyLimit(tasks, MAX_CONCURRENT);
  
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
  
  return 0;
}

function usage(): void {
  console.log(`Usage: tldhunt -k <keyword> [-e <tld> | -E <tld-file>] [-x] [--update-tld]
Example: tldhunt -k linuxsec -E tlds.txt
       : tldhunt --update-tld`);
}

if (import.meta.main) {
  const args = Bun.argv.slice(2);
  const exitCode = await main(args);
  process.exit(exitCode);
}