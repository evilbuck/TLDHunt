# TLDHunt - Domain Availability Checker

TLDHunt is a command-line tool designed to help users find available domain names for their online projects or businesses. By providing a keyword and a list of TLD (top-level domain) extensions, TLDHunt checks the availability of domain names that match the given criteria. This tool is particularly useful for those who want to quickly find a domain name that is not already taken, without having to perform a manual search on a domain registrar website.

For red teaming or phishing purposes, this tool can help you to find similar domains with different extensions from the original domain.

> [!NOTE]  
> Tested on: **Linux** with **whois v5.5.15** and **Bun v1.3.9**

# Dependencies

This tool requires the following dependencies:
- **Bun**: JavaScript/TypeScript runtime (https://bun.sh)
- **whois**: Used to check domain availability

Install whois on Debian-based systems:
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
➜  TLDHunt bun run src/index.ts
 _____ _    ___  _  _          _   
|_   _| |  |   \| || |_  _ _ _| |_ 
  | | | |__| |) | __ | || | ' \  _|
  |_| |____|___/|_||_|\_,_|_||_\__|
        Domain Availability Checker

Keyword is required.
Usage: tldhunt -k <keyword> [-e <tld> | -E <tld-file>] [-x] [--update-tld]
Example: tldhunt -k linuxsec -E tlds.txt
       : tldhunt --update-tld
```

## Examples

### Update TLD list from IANA
```bash
bun run src/index.ts --update-tld
```

### Check single keyword against multiple TLDs
```bash
bun run src/index.ts -k linuxsec -E tlds.txt
```

### Check multiple keywords against specific TLDs
```bash
bun run src/index.ts -K "myproject,startup,devops" -e .com -e .io -e .ai
```

### Check single keyword against a single TLD
```bash
bun run src/index.ts -k linuxsec -e .com
```

### Show only available domains
```bash
bun run src/index.ts -k linuxsec -E tlds.txt -x
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
| `-k, --keyword <keyword>` | Single keyword to check |
| `-K, --keywords <keywords>` | Multiple keywords (comma-separated) |
| `-e, --tld <tld>` | Single TLD to check |
| `-E, --tld-file <file>` | File containing TLDs to check |
| `-x, --available-only` | Show only available domains |
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
bun run src/index.ts -k test -e .com
```

# Legacy Shell Script

The original Bash implementation is preserved as `tldhunt.sh` for reference.