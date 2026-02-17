# TLDHunt - Agent Tool Instructions

---
name: Agent Tool Instructions
domain: [agent-tool, automation, domain-checking]
description: Instructions for AI agents to use TLDHunt as a tool for domain availability checking
---

## Overview

TLDHunt is a CLI tool that checks domain availability across multiple TLD extensions using WHOIS queries. It outputs results as JSON for programmatic consumption.

**Quick Start:**
```bash
bun run check <keyword> -j
```

## Prerequisites

Before invoking, ensure the system has:

| Dependency | Install Command |
|------------|-----------------|
| **whois** | Arch: `sudo pacman -S whois` / Debian: `sudo apt install whois -y` |
| **Bun** | `curl -fsSL https://bun.sh/install \| bash` |
| **Dependencies** | `bun install` (if running from source) |

## CLI Surface

### Command

```bash
bun run src/index.ts [options]
# or
bun run check [options]
```

### Options

| Option | Alias | Argument | Description |
|--------|-------|----------|-------------|
| positional | - | `<keyword>` | Keyword to check (shorthand for `-k`) |
| `--keyword` | `-k` | `<string>` | Single keyword |
| `--keywords` | `-K` | `<string>` | Comma-separated keywords |
| `--tld` | `-e` | `<string>` | Single TLD (dot auto-added if missing) |
| `--tld-file` | `-E` | `<path>` | File with TLDs (one per line, with leading dot) |
| `--available-only` | `-x` | - | Filter to available domains only |
| `--json` | `-j` | - | **Required for agents** - JSON output |
| `--update-tld` | - | - | Update TLD list from IANA (exclusive) |

### Defaults

- **Default TLDs**: `.com`, `.net`, `.io`, `.ai` (used when no `-e` or `-E` specified)
- **Concurrency**: 30 parallel WHOIS queries

### Validation Rules

| Rule | Error Message |
|------|---------------|
| Keyword required | `"Keyword is required."` |
| `-e` and `-E` mutually exclusive | `"You can only specify one of -e or -E options."` |
| TLD file must exist | `"TLD file <path> not found."` |
| `--update-tld` is exclusive | `"--update-tld cannot be used with other flags."` |

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Validation error or invalid arguments |

## JSON Output Schema

When using `-j`, output is a JSON array printed to stdout:

```typescript
interface JsonOutput {
  domain: string;      // e.g., "myproject.com"
  available: boolean;   // true = available, false = taken
}

type Output = JsonOutput[];
```

**Example:**
```json
[
  {"domain":"myproject.com","available":false},
  {"domain":"myproject.ai","available":true},
  {"domain":"myproject.io","available":false}
]
```

With `-x` flag, only available domains are returned:
```json
[
  {"domain":"myproject.ai","available":true}
]
```

## Detection Logic

A domain is considered **registered** (`available: false`) if WHOIS output contains any of these signatures (case-insensitive):

| Signature | Common In |
|-----------|-----------|
| `Name Server` | Most gTLDs (.com, .net, .org) |
| `nserver` | Some ccTLDs |
| `nameservers` | Various registries |
| `status: active` | Some European TLDs |

**Implementation**: `src/domain-checker.ts:10-20`

### Fail-Open Behavior

If the WHOIS query fails or throws an error, the domain is marked as **available** (`available: true`). This prevents false positives from network issues.

## Common Invocation Patterns

### Check single keyword, default TLDs
```bash
bun run check myproject -j
```

### Check single keyword, specific TLDs
```bash
bun run check myproject -e .com -e .io -e .ai -j
```

### Check multiple keywords
```bash
bun run check -K "myproject,startup,devops" -e .com -j
```

### Bulk check with TLD file, available only
```bash
bun run check myproject -E tlds.txt -x -j
```

### Update TLD list from IANA
```bash
bun run check --update-tld
```
Output: `"Fetching TLD data from IANA..."` followed by `"TLDs have been saved to tlds.txt."`

## TLD File Format

Custom TLD files must have one TLD per line with leading dot:

```
.com
.org
.net
.io
.ai
```

The default `tlds.txt` is fetched from IANA: `https://data.iana.org/TLD/tlds-alpha-by-domain.txt`

## Edge Cases & Limitations

| Scenario | Behavior |
|----------|----------|
| WHOIS timeout/failure | Domain marked as available (fail-open) |
| Rate limiting | Built-in 30 concurrent query limit; may still hit rate limits on some TLDs |
| Invalid TLD | WHOIS may return empty; treated as available |
| Very long keyword | No validation; WHOIS may fail |
| Unicode/international domains | Not tested; behavior undefined |

## Integration Examples

### Parse available domains with jq
```bash
bun run check myproject -j | jq '.[] | select(.available) | .domain'
```

### Count available vs taken
```bash
bun run check myproject -j | jq 'group_by(.available) | map({available: .[0].available, count: length})'
```

### Find first available domain
```bash
bun run check myproject -x -j | jq -r '.[0].domain'
```

### Store results for later processing
```bash
bun run check myproject -e .com -e .io -j > results.json
```

## Performance Characteristics

| Input Size | Expected Time |
|------------|---------------|
| 1 keyword, 4 TLDs (default) | ~5-10 seconds |
| 1 keyword, 1500 TLDs | ~2-5 minutes |
| 10 keywords, 4 TLDs | ~20-30 seconds |

Times vary based on network latency and WHOIS server responsiveness.

## File References

| File | Purpose |
|------|---------|
| `src/index.ts` | Entry point, orchestrates workflow |
| `src/cli.ts` | Argument parsing and validation |
| `src/domain-checker.ts` | WHOIS execution and detection logic |
| `src/tld-updater.ts` | IANA TLD fetching |
| `src/types.ts` | TypeScript interfaces |
| `tlds.txt` | Default TLD list (~1500 TLDs) |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `whois: command not found` | Install whois package |
| All domains show available | Check network connectivity; WHOIS may be blocked |
| Slow performance | Reduce TLD count with `-e` flags instead of bulk `-E` |
| JSON parse errors | Tool may have printed errors to stderr; check with `2>&1` |