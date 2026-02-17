# Backlog

## Details

### update-agents-md
**Description**: Update AGENTS.md for TypeScript codebase
**Context**: 
- Relevant files: `AGENTS.md`
- Requirements: Replace Bash code style guidelines with TypeScript/Bun conventions
- Status: COMPLETED (2026-02-17)

### remove-unused-boune
**Description**: Remove unused `boune` dependency
**Context**:
- Relevant files: `package.json`, `bun.lock`
- Requirements: Remove `boune` from dependencies since it's never imported
- Current state: CLI parsing is done manually in `cli.ts` with switch statement
- Related work: typescript-conversion-2026-02-17.md

## High Priority
(none)

## Medium Priority
- [ ] [Remove unused boune dependency](#remove-unused-boune)

## Low Priority / Nice to Have
- [ ] Add npm-compatible scripts for users without Bun

## Completed
- [x] Create CONTEXT.md project context file (2026-02-17)
- [x] Update AGENTS.md for TypeScript codebase (2026-02-17)
- [x] Create ARCHITECTURE.md documentation (2026-02-17)
- [x] Convert Bash script to TypeScript with Bun runtime (2026-02-17)