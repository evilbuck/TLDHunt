# TLDHunt - Agent Context

## Project Overview

TLDHunt is a TypeScript command-line tool for checking domain name availability across multiple TLD extensions. It uses `whois` queries to detect if domains are registered.

**Tech Stack**: TypeScript with Bun runtime
**Dependencies**: `whois` (system package), Bun runtime

---

## Commands

### Running the Tool

```bash
# Basic usage
bun run src/index.ts -k <keyword> -E <tld-file>

# Check domain with TLD list
bun run src/index.ts -k linuxsec -E tlds.txt

# Check single TLD
bun run src/index.ts -k linuxsec -e .com

# Check multiple keywords
bun run src/index.ts -K "myproject,startup" -e .com -e .io

# Show only available domains
bun run src/index.ts -k linuxsec -E tlds.txt -x

# Update TLD list from IANA
bun run src/index.ts --update-tld
```

### Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Run specific test file
bun test test/domain-checker.test.ts

# Run with watch mode
bun test --watch
```

---

## Code Style Guidelines

### TypeScript Configuration

- Target: ESNext
- Module: Preserve (Bun handles bundling)
- Strict mode enabled
- Use `verbatimModuleSyntax` for explicit type imports

### Imports

```typescript
// Use type-only imports for types
import type { DomainResult } from "./types";

// Regular imports for values
import { checkDomain } from "./domain-checker";
```

### Variable Declarations

```typescript
// Use const for immutable values
const tlds: string[] = [];

// Use let only when reassignment needed
let count = 0;

// Boolean flags
const availableOnly = false;
```

### Functions

```typescript
// Export functions with explicit return types
export function checkDomain(domain: string): Promise<DomainResult> {
  // ...
}

// Use arrow functions for callbacks
const results = await Promise.all(domains.map(d => checkDomain(d)));
```

### Async/Await

```typescript
// Prefer async/await over .then()
const output = await executeWhois(domain);

// Handle errors with try/catch
try {
  const result = await checkDomain(domain);
} catch {
  // Handle gracefully
}
```

### Error Handling

```typescript
// Throw descriptive errors
if (!response.ok) {
  throw new Error(`Failed to fetch: ${response.statusText}`);
}

// Console.error for user-facing errors
console.error("TLD file not found");

// Exit with non-zero code
process.exit(1);
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `tldFile`, `whoisOutput` |
| Constants | SCREAMING_SNAKE_CASE | `TLD_URL`, `MAX_CONCURRENT` |
| Functions | camelCase | `checkDomain`, `parseArgs` |
| Interfaces | PascalCase | `DomainResult`, `ParsedArgs` |
| Files | kebab-case | `domain-checker.ts` |

### Comments

- No header comments needed
- Add JSDoc for public APIs
- Comment complex logic or gotchas

---

## Project Structure

```
TLDHunt/
├── src/
│   ├── index.ts          # Entry point, orchestrates workflow
│   ├── cli.ts            # Argument parsing and validation
│   ├── domain-checker.ts # WHOIS queries and registration detection
│   ├── tld-updater.ts    # IANA TLD list fetching
│   ├── table-formatter.ts# Result table output
│   ├── banner.ts         # ASCII banner display
│   └── types.ts          # Shared TypeScript interfaces
├── test/
│   ├── cli.test.ts
│   ├── domain-checker.test.ts
│   ├── tld-updater.test.ts
│   ├── table-formatter.test.ts
│   └── integration.test.ts
├── tlds.txt              # Default TLD list from IANA
├── package.json
├── tsconfig.json
└── README.md
```

---

## Important Notes

### Domain Detection Logic

Domains are considered **registered** if whois output contains:
- `Name Server`
- `nserver`
- `nameservers`
- `status: active`

Detection is case-insensitive.

### Parallelism

The script runs up to 30 concurrent whois queries to balance speed vs. rate limiting.

### Dependency Injection

Core functions accept optional parameters for testability:

```typescript
// checkDomain accepts a custom whois executor
await checkDomain("example.com", mockWhoisExecutor);

// updateTldList accepts custom fetcher/writer
await updateTldList(mockFetcher, mockWriter, "test.txt");
```

### TLD File Format

```
.com
.org
.net
```

One TLD per line, with leading dot.

---

## Testing

Tests use Bun's built-in test runner:

```bash
bun test
```

### Test Patterns

```typescript
import { describe, test, expect, mock } from "bun:test";

describe("checkDomain", () => {
  test("detects registered domain", async () => {
    const mockOutput = "Name Server: ns1.example.com";
    const result = await checkDomain("example.com", () => Promise.resolve(mockOutput));
    
    expect(result.available).toBe(false);
  });
});
```

### Mocking

```typescript
// Mock functions with mock()
const mockFetcher = mock(() => Promise.resolve("com\norg"));

// Restore mocks after tests
beforeEach(() => mock.restore());
afterEach(() => mock.restore());
```

---

## Architecture

See `.context/ARCHITECTURE.md` for detailed architecture documentation including:
- Module responsibilities
- Data flow diagram
- Key design decisions