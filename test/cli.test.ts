import { describe, test, expect } from "bun:test";
import { parseArgs, validateArgs, type ParsedArgs } from "../src/cli";

describe("parseArgs", () => {
  test("parses single keyword with -k", () => {
    const result = parseArgs(["-k", "linuxsec"]);
    
    expect(result.keywords).toEqual(["linuxsec"]);
  });

  test("parses single keyword with --keyword", () => {
    const result = parseArgs(["--keyword", "linuxsec"]);
    
    expect(result.keywords).toEqual(["linuxsec"]);
  });

  test("parses multiple keywords with -K (comma-separated)", () => {
    const result = parseArgs(["-K", "linuxsec,myproject,devops"]);
    
    expect(result.keywords).toEqual(["linuxsec", "myproject", "devops"]);
  });

  test("parses multiple keywords with --keywords", () => {
    const result = parseArgs(["--keywords", "linuxsec,myproject"]);
    
    expect(result.keywords).toEqual(["linuxsec", "myproject"]);
  });

  test("parses single TLD with -e", () => {
    const result = parseArgs(["-e", ".com"]);
    
    expect(result.tlds).toEqual([".com"]);
  });

  test("parses single TLD with --tld", () => {
    const result = parseArgs(["--tld", ".io"]);
    
    expect(result.tlds).toEqual([".io"]);
  });

  test("parses TLD file with -E", () => {
    const result = parseArgs(["-E", "tlds.txt"]);
    
    expect(result.tldFile).toBe("tlds.txt");
  });

  test("parses TLD file with --tld-file", () => {
    const result = parseArgs(["--tld-file", "custom-tlds.txt"]);
    
    expect(result.tldFile).toBe("custom-tlds.txt");
  });

  test("parses available-only flag with -x", () => {
    const result = parseArgs(["-x"]);
    
    expect(result.availableOnly).toBe(true);
  });

  test("parses available-only flag with --available-only", () => {
    const result = parseArgs(["--available-only"]);
    
    expect(result.availableOnly).toBe(true);
  });

  test("parses update-tld flag", () => {
    const result = parseArgs(["--update-tld"]);
    
    expect(result.updateTld).toBe(true);
  });

  test("parses combined flags", () => {
    const result = parseArgs([
      "-k", "linuxsec",
      "-e", ".com",
      "-x"
    ]);
    
    expect(result.keywords).toEqual(["linuxsec"]);
    expect(result.tlds).toEqual([".com"]);
    expect(result.availableOnly).toBe(true);
  });

  test("returns empty arrays for missing optional args", () => {
    const result = parseArgs([]);
    
    expect(result.keywords).toEqual([]);
    expect(result.tlds).toEqual([]);
    expect(result.tldFile).toBeUndefined();
    expect(result.availableOnly).toBe(false);
    expect(result.updateTld).toBe(false);
  });

  test("handles TLD without leading dot", () => {
    const result = parseArgs(["-e", "com"]);
    
    expect(result.tlds).toEqual([".com"]);
  });
});

describe("validateArgs", () => {
  test("errors when no keyword provided", () => {
    const args: ParsedArgs = {
      keywords: [],
      tlds: [".com"],
      availableOnly: false,
      updateTld: false,
    };
    
    const result = validateArgs(args);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Keyword is required.");
  });

  test("errors when both -e and -E specified", () => {
    const args: ParsedArgs = {
      keywords: ["linuxsec"],
      tlds: [".com"],
      tldFile: "tlds.txt",
      availableOnly: false,
      updateTld: false,
    };
    
    const result = validateArgs(args);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe("You can only specify one of -e or -E options.");
  });

  test("errors when neither -e nor -E specified", () => {
    const args: ParsedArgs = {
      keywords: ["linuxsec"],
      tlds: [],
      availableOnly: false,
      updateTld: false,
    };
    
    const result = validateArgs(args);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Either -e or -E option is required.");
  });

  test("errors when TLD file not found", () => {
    const args: ParsedArgs = {
      keywords: ["linuxsec"],
      tldFile: "nonexistent.txt",
      availableOnly: false,
      updateTld: false,
      fileExists: () => false,
    };
    
    const result = validateArgs(args);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe("TLD file nonexistent.txt not found.");
  });

  test("errors when --update-tld used with other flags", () => {
    const args: ParsedArgs = {
      keywords: ["linuxsec"],
      tlds: [".com"],
      availableOnly: false,
      updateTld: true,
    };
    
    const result = validateArgs(args);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe("--update-tld cannot be used with other flags.");
  });

  test("validates --update-tld alone", () => {
    const args: ParsedArgs = {
      keywords: [],
      tlds: [],
      availableOnly: false,
      updateTld: true,
    };
    
    const result = validateArgs(args);
    
    expect(result.valid).toBe(true);
  });

  test("validates keyword with single TLD", () => {
    const args: ParsedArgs = {
      keywords: ["linuxsec"],
      tlds: [".com"],
      availableOnly: false,
      updateTld: false,
    };
    
    const result = validateArgs(args);
    
    expect(result.valid).toBe(true);
  });

  test("validates keyword with TLD file", () => {
    const args: ParsedArgs = {
      keywords: ["linuxsec"],
      tldFile: "tlds.txt",
      availableOnly: false,
      updateTld: false,
      fileExists: () => true,
    };
    
    const result = validateArgs(args);
    
    expect(result.valid).toBe(true);
  });

  test("validates available-only flag with other required args", () => {
    const args: ParsedArgs = {
      keywords: ["linuxsec"],
      tlds: [".com"],
      availableOnly: true,
      updateTld: false,
    };
    
    const result = validateArgs(args);
    
    expect(result.valid).toBe(true);
  });
});