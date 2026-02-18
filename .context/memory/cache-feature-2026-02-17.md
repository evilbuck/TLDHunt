---
date: 2026-02-17
domains: [feature, sqlite, caching]
topics: [domain-checker, cache, sqlite, performance]
priority: high
status: active
---

# Session: 2026-02-17 - Domain Check Caching Feature

## Context
- Previous work: Basic domain availability checker with whois queries
- Goal: Add SQLite caching to skip re-checking recently queried domains

## Decisions Made
- Cache stored in `~/.tldhunt/cache.db` (global, shared across all projects)
- Default TTL: 60 days (1440 hours) - configurable via `--cache-ttl`
- Uses `bun:sqlite` (built-in, no new dependencies)
- Cache table schema: `(domain TEXT PRIMARY KEY, available INTEGER, checked_at INTEGER)`

## Implementation Notes

### New Files
- `src/cache.ts` - Cache module with initCache, getCachedResult, saveResult, clearCache, closeCache

### Modified Files
- `src/types.ts` - Added CachedResult and CacheOptions interfaces
- `src/cli.ts` - Added --no-cache, --clear-cache, --cache-ttl <hours> flags
- `src/index.ts` - Integrated cache into main flow, fixed concurrency limit bug

### CLI Flags Added
| Flag | Description |
|------|-------------|
| `--cache-ttl <hours>` | Cache timeout in hours (default: 1440 = 60 days) |
| `--no-cache` | Skip cache, always perform fresh whois lookup |
| `--clear-cache` | Clear all cached results and exit |

### Cache Flow
1. Check cache for valid (non-expired) entry
2. If found → return cached result
3. If not found → perform whois query
4. Save result to cache
5. Return result

### Bug Fix
Fixed `runWithConcurrencyLimit` function - the previous async filter implementation was incorrect.

## Performance
- Cached lookup: ~14ms
- Fresh whois lookup: ~100-200ms
- Cache provides ~10x speedup for repeated queries

## Next Steps
- Consider adding cache stats output (hits/misses)
- Consider adding --cache-info flag to show cache size