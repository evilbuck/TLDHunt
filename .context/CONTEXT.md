# TLDHunt - Project Context

---
name: Project Context
domain: all
description: Core project information and conventions
---

## Project Overview
- **Name**: TLDHunt
- **Purpose**: Domain availability checker across multiple TLD extensions using WHOIS queries
- **Tech stack**: TypeScript, Bun runtime, whois CLI

## Development Setup

- **Install**: `bun install`
- **Run**: `bun run src/index.ts -k <keyword> -e <tld>`
- **Test**: `bun test`
- **Build**: N/A (Bun runs TypeScript directly)

## Project-Specific Conventions

- **Code style**: TypeScript strict mode, ESNext target
- **Naming**: camelCase for functions/variables, PascalCase for interfaces
- **Files**: kebab-case (e.g., `domain-checker.ts`)
- **Imports**: Use `import type` for type-only imports

## Important Files/Directories

| Path | Purpose |
|------|---------|
| `src/index.ts` | Entry point, workflow orchestration |
| `src/cli.ts` | Argument parsing |
| `src/domain-checker.ts` | WHOIS query logic |
| `src/cache.ts` | SQLite caching for domain results |
| `src/tld-updater.ts` | IANA TLD fetching |
| `src/table-formatter.ts` | Output formatting |
| `test/*.test.ts` | Unit tests |
| `tlds.txt` | Default TLD list |
| `~/.tldhunt/cache.db` | Domain result cache database |
| `tldhunt.sh` | Legacy Bash implementation (preserved) |

## External Dependencies

- **whois**: System package for WHOIS queries
- **IANA**: https://data.iana.org/TLD/tlds-alpha-by-domain.txt for TLD list

## Known Gotchas

- Max 30 concurrent WHOIS queries to avoid rate limiting
- WHOIS failures are treated as "available" (fail-open)
- `boune` package in dependencies is unused - candidate for removal
- Legacy `tldhunt.sh` preserved for reference only

## Architecture Reference

See `.context/ARCHITECTURE.md` for detailed module documentation.