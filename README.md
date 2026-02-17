# TLDHunt - Domain Availability Checker

TLDHunt is a command-line tool designed to help users find available domain names for their online projects or businesses. By providing a keyword and a list of TLD (top-level domain) extensions, TLDHunt checks the availability of domain names that match the given criteria. This tool is particularly useful for those who want to quickly find a domain name that is not already taken, without having to perform a manual search on a domain registrar website.

For red teaming or phishing purposes, this tool can help you to find similar domains with different extensions from the original domain.

> [!NOTE]
> **For AI Agents**: If you're an AI agent looking to use TLDHunt as a tool, see [`.context/AGENT_TOOL.md`](.context/AGENT_TOOL.md) for usage instructions, JSON output schema, and integration patterns.

> [!NOTE]  
> Tested on: **Arch Linux, BTW** with **whois v5.5.15** and **Bun v1.3.9**

# Dependencies

This tool requires the following dependencies:
- **Bun**: JavaScript/TypeScript runtime (https://bun.sh)
- **whois**: Used to check domain availability

Install whois:

**Arch-based systems:**
```bash
sudo pacman -S whois
```

**Debian-based systems:**
```bash
sudo apt install whois -y
```

Install Bun:
```bash
curl -fsSL https://bun.sh/install | bash
```

# How It Works

To detect whether a domain is registered or not, we search for the words "**Name Server**", "**nserver**", "**nameservers**", or "**status: active**" in the output of the WHOIS command, as this is a signature of a registered domain (thanks to [Alex Matveenko](https://github.com/Alex-Matveenko) for the suggestion). 

If you have a better signature or detection method, please feel free to submit a pull request.

# Domain Extension List

For the default Top Level Domain list (`tlds.txt`), we use data from https://data.iana.org. You can update this list directly using the `--update-tld` flag, which fetches the latest TLDs from IANA and saves them to `tlds.txt`.

You can also use a custom TLD list, but ensure it is formatted like this:
```
.com
.org
.net
.io
.ai
```

# How to Use

```
➜  TLDHunt bun run check linuxsec
 _____ _    ___  _  _          _   
|_   _| |  |   \| || |_  _ _ _| |_ 
  | | | |__| |) | __ | || | ' \  _|
  |_| |____|___/|_||_|\_,_|_||_\__|
        Domain Availability Checker

Checking 1 keyword(s) against 1500 TLD(s)...
```

## Examples

### Check a keyword (uses default TLDs: .com, .net, .io, .ai)
```bash
bun run check linuxsec
```

### Check multiple keywords against specific TLDs
```bash
bun run check -K "myproject,startup,devops" -e .com -e .io -e .ai
```

### Check a keyword against a single TLD
```bash
bun run check linuxsec -e .com
```

### Show only available domains
```bash
bun run check linuxsec -x
```

### Output as JSON (for scripts/agents)
```bash
bun run check linuxsec -j
```

### Update TLD list from IANA
```bash
bun run check --update-tld
```

# Output Format

Results are displayed in a table format:

```
┌───────────┬──────┬─────┬─────┐
│ Domain    │ .com │ .ai │ .io │
├───────────┼──────┼─────┼─────┤
│ linuxsec  │  ✗   │  ✓  │  ✗  │
│ myproject │  ✓   │  ✗  │  ✓  │
└───────────┴──────┴─────┴─────┘

Summary: 2 available, 4 taken
```

- ✓ = Domain is available
- ✗ = Domain is taken

# Command Line Options

| Option | Description |
|--------|-------------|
| `<keyword>` | Keyword to check (positional, optional with `-k`) |
| `-k, --keyword <keyword>` | Single keyword to check |
| `-K, --keywords <keywords>` | Multiple keywords (comma-separated) |
| `-e, --tld <tld>` | Single TLD to check (default: .com, .net, .io, .ai) |
| `-E, --tld-file <file>` | File containing TLDs to check |
| `-x, --available-only` | Show only available domains |
| `-j, --json` | Output results as compact JSON |
| `--update-tld` | Update TLD list from IANA |

# Development

## Setup
```bash
bun install
```

## Run Tests
```bash
bun test
```

## Run CLI
```bash
bun run check test -e .com
```

# Legacy Shell Script

The original Bash implementation is preserved as `tldhunt.sh` for reference.
