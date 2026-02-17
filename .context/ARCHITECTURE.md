# TLDHunt Architecture

## Overview

TLDHunt is a domain availability checker that queries WHOIS servers to determine if domain names are registered across multiple TLD extensions.

## Tech Stack

- **Runtime**: Bun v1.3.9+
- **Language**: TypeScript 5.x
- **External Dependencies**: `whois` CLI tool (system package)

## Architecture

```
src/
├── index.ts          # Entry point, orchestrates workflow
├── cli.ts            # Argument parsing and validation
├── domain-checker.ts # WHOIS queries and registration detection
├── tld-updater.ts    # IANA TLD list fetching and parsing
├── table-formatter.ts# Result table output formatting
├── banner.ts         # ASCII art banner display
└── types.ts          # Shared TypeScript interfaces

test/
├── cli.test.ts           # CLI parsing unit tests
├── domain-checker.test.ts# Domain detection logic tests
├── tld-updater.test.ts   # TLD fetching tests
├── table-formatter.test.ts# Output formatting tests
└── integration.test.ts   # End-to-end workflow tests
```

## Module Responsibilities

### `index.ts` (Entry Point)
- Parses command-line arguments
- Coordinates workflow between modules
- Manages concurrent WHOIS queries (max 30 parallel)
- Filters and displays results

### `cli.ts` (CLI Module)
- `parseArgs()`: Parses command-line flags into structured args
- `validateArgs()`: Validates argument combinations and file existence

### `domain-checker.ts` (Domain Module)
- `checkDomain()`: Executes whois query, returns availability status
- `isRegistered()`: Detects registration signatures in WHOIS output
- `parseDomain()`: Splits domain into keyword and TLD components

### `tld-updater.ts` (TLD Module)
- `updateTldList()`: Fetches TLD list from IANA, writes to file
- `parseTldList()`: Parses raw IANA data into TLD array

### `table-formatter.ts` (Output Module)
- `formatResultsTable()`: Formats results as ASCII table
- `countResults()`: Counts available vs taken domains

## Data Flow

```
CLI Args → parseArgs() → validateArgs()
                              ↓
              ┌─────────────────────────────────┐
              │ For each keyword × TLD combination│
              │         ↓                        │
              │   checkDomain() → WHOIS query    │
              │         ↓                        │
              │   DomainResult { keyword, tld,   │
              │                   available }    │
              └─────────────────────────────────┘
                              ↓
              formatResultsTable() → Console output
```

## Key Design Decisions

### Concurrency Limiting
- Max 30 concurrent WHOIS queries to avoid rate limiting
- Uses `runWithConcurrencyLimit()` with Promise.race pattern

### Registration Detection
Domains are registered if WHOIS output contains any of:
- `Name Server`
- `nserver`
- `nameservers`
- `status: active`

Detection is case-insensitive.

### Dependency Injection
Core functions accept optional executor/fetcher parameters for testability:
- `checkDomain(domain, executor?)` - injectable WHOIS executor
- `updateTldList(fetcher?, writer?)` - injectable fetch/writer
- `validateArgs(args)` - injectable file existence checker

## File Formats

### TLD List (`tlds.txt`)
```
.com
.org
.net
```
- One TLD per line
- Leading dot required
- Lowercase only

### Command Line Interface
```bash
bun run src/index.ts -k <keyword> [-e <tld> | -E <tld-file>] [-x] [--update-tld]
```

## Error Handling

- Missing keyword → exit with usage message
- Missing TLD specification → exit with usage message
- TLD file not found → exit with error message
- WHOIS query failure → treat as available (fail-open)

## Testing Strategy

- Unit tests for each module with mocked dependencies
- Integration tests for workflow coordination
- Use `bun test` runner (built-in)