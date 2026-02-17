# TLDHunt - Agent Context

## Project Overview

TLDHunt is a Bash-based command-line tool for checking domain name availability across multiple TLD extensions. It uses `whois` queries to detect if domains are registered.

**Tech Stack**: Pure Bash (no build system, no tests)
**Dependencies**: `whois`, `curl`

---

## Commands

This is a standalone Bash script with no build/test/lint infrastructure.

### Running the Tool

```bash
# Basic usage
./tldhunt.sh -k <keyword> -E <tld-file>

# Check domain with TLD list
./tldhunt.sh -k linuxsec -E tlds.txt

# Check single TLD
./tldhunt.sh -k linuxsec -e .com

# Show only available domains
./tldhunt.sh -k linuxsec -E tlds.txt --not-registered

# Update TLD list from IANA
./tldhunt.sh --update-tld
```

### Linting

```bash
# Optional: Check for shell script issues
shellcheck tldhunt.sh
```

---

## Code Style Guidelines

### Shebang & Encoding

- Always use `#!/bin/bash` as shebang
- No encoding declaration needed for pure Bash

### Variable Declarations

```bash
# Color/style variables: use default assignment syntax at top of file
: "${blue:=\033[0;34m}"
: "${green:=\033[0;32m}"

# Regular variables: assign without spaces around equals
variable="value"

# Boolean flags: use true/false strings
flag=false

# Arrays: initialize empty, then populate
tlds=()
readarray -t tlds < "$file"
```

### Conditionals

```bash
# ALWAYS use [[ ]] for tests (bash-specific, safer than [ ])
[[ -z $variable ]] && { echo "Error"; exit 1; }
[[ -n $variable ]] && do_something

# String comparisons
[[ "$var" = "value" ]]

# Numeric comparisons
(( count >= 30 ))

# File tests
[[ -f $file ]]
[[ -d $dir ]]
```

### Functions

```bash
# Use function_name() syntax
check_domain() {
    local domain="$1"
    local result=""

    # Function body
}

# Call functions with arguments
check_domain "$domain"
```

### Local Variables

```bash
# ALWAYS declare local variables inside functions
local var="value"
local output
output=$(command)
```

### Command Substitution

```bash
# Use $() syntax, NOT backticks
result=$(whois "$domain" 2>/dev/null)
```

### Error Handling

```bash
# Check command availability before use
command -v whois &> /dev/null || { echo "whois not installed" >&2; exit 1; }

# Redirect stderr to /dev/null for expected failures
output=$(whois "$domain" 2>/dev/null)

# Error messages to stderr
echo "Error message" >&2

# Exit with non-zero on errors
exit 1
```

### Argument Parsing

```bash
# Use while loop with case statement
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -k|--keyword) keyword="$2"; shift ;;
        -e|--tld) tld="$2"; shift ;;
        -x|--flag) flag=true ;;
        --option) action=true ;;
        *) echo "Unknown parameter: $1"; usage ;;
    esac
    shift
done
```

### Output & Colors

```bash
# Use echo -e for colored output
echo -e "[${b_green}avail${reset}] $domain"

# Color definitions (use these variable names):
# ${red}, ${green}, ${blue}, ${cyan}, ${orange}
# ${b_red}, ${b_green} (bold variants)
# ${reset} (reset formatting)
# ${bold}
```

### Parallel Execution

```bash
# Run in background with &
check_domain "$domain" &

# Limit parallel jobs
if (( $(jobs -r -p | wc -l) >= 30 )); then
    wait -n
fi

# Wait for all background jobs
wait
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | lowercase, underscores | `tld_file`, `whois_output` |
| Constants/config | lowercase | `tld_url` |
| Functions | lowercase, underscores | `check_domain`, `usage` |
| Boolean flags | lowercase | `nreg`, `update_tld` |
| Arrays | lowercase, plural | `tlds` |

### Comments

- No header comments needed (project is simple)
- Add inline comments for non-obvious logic only
- Comment regex patterns or complex pipelines

### Pipelines

```bash
# Chain commands for text processing
curl -s "$url" | \
    grep -v '^#' | \
    tr '[:upper:]' '[:lower:]' | \
    sed 's/^/./' > "$output_file"
```

---

## Project Structure

```
TLDHunt/
├── tldhunt.sh      # Main script (entry point)
├── tlds.txt        # Default TLD list from IANA
├── top-12.txt      # Example: top 12 TLDs
├── README.md       # Documentation
└── AGENTS.md       # This file
```

---

## Important Notes

### Domain Detection Logic

Domains are considered **registered** if whois output contains:
- `Name Server`
- `nserver`
- `nameservers`
- `status: active`

### Parallelism

The script runs up to 30 concurrent whois queries to balance speed vs. rate limiting.

### TLD File Format

```
.com
.org
.net
```

One TLD per line, with leading dot.

---

## Testing

No automated tests exist. Manual testing:

```bash
# Test basic functionality
./tldhunt.sh -k testdomain -E top-12.txt

# Test update feature
./tldhunt.sh --update-tld

# Test with shellcheck
shellcheck tldhunt.sh
```