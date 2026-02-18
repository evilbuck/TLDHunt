import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { checkDomain, isRegistered, REGISTRATION_SIGNATURES } from "../src/domain-checker";

describe("isRegistered", () => {
  test.each([
    ["Name Server", "Domain registered with Name Server", true],
    ["nserver", "nserver: ns1.example.com", true],
    ["nameservers", "nameservers: ns1.example.com ns2.example.com", true],
    ["status: active", "status: active", true],
    ["Name Server", "Name Server: ns1.example.com", true],
    ["no signature", "This domain is not registered", false],
    ["empty output", "", false],
  ])('detects "%s" in whois output', (_signature, output, expected) => {
    expect(isRegistered(output)).toBe(expected);
  });

  test("is case insensitive for Name Server", () => {
    expect(isRegistered("NAME SERVER: ns1.example.com")).toBe(true);
    expect(isRegistered("name server: ns1.example.com")).toBe(true);
  });

  test("is case insensitive for nserver", () => {
    expect(isRegistered("NSERVER: ns1.example.com")).toBe(true);
  });

  test("is case insensitive for nameservers", () => {
    expect(isRegistered("NAMESERVERS: ns1.example.com")).toBe(true);
  });

  test("is case insensitive for status: active", () => {
    expect(isRegistered("STATUS: ACTIVE")).toBe(true);
  });
});

describe("checkDomain", () => {
  const mockSpawn = mock(() => {});

  beforeEach(() => {
    mock.restore();
  });

  afterEach(() => {
    mock.restore();
  });

  test("returns available for unregistered domain", async () => {
    const mockWhoisOutput = "No match for domain EXAMPLE.NOTREAL\n\n";
    
    const result = await checkDomain("example.notreal", () => Promise.resolve(mockWhoisOutput));
    
    expect(result).toEqual({
      keyword: "example",
      tld: ".notreal",
      available: true,
      expiresAt: null,
    });
  });

  test("returns taken for registered domain with Name Server", async () => {
    const mockWhoisOutput = `
Domain Name: EXAMPLE.COM
Registry Domain ID: 12345
Name Server: NS1.EXAMPLE.COM
Name Server: NS2.EXAMPLE.COM
    `;
    
    const result = await checkDomain("example.com", () => Promise.resolve(mockWhoisOutput));
    
    expect(result).toEqual({
      keyword: "example",
      tld: ".com",
      available: false,
      expiresAt: null,
    });
  });

  test("extracts keyword and TLD correctly", async () => {
    const result = await checkDomain("linuxsec.io", () => Promise.resolve("No match"));
    
    expect(result.keyword).toBe("linuxsec");
    expect(result.tld).toBe(".io");
  });

  test("handles domain with multiple dots", async () => {
    const result = await checkDomain("sub.example.com", () => Promise.resolve("No match"));
    
    expect(result.keyword).toBe("sub.example");
    expect(result.tld).toBe(".com");
  });

  test("handles whois errors gracefully", async () => {
    const result = await checkDomain("example.com", () => Promise.reject(new Error("whois failed")));
    
    expect(result.available).toBe(true);
  });
});

describe("REGISTRATION_SIGNATURES", () => {
  test("contains all required signatures", () => {
    expect(REGISTRATION_SIGNATURES).toContain("Name Server");
    expect(REGISTRATION_SIGNATURES).toContain("nserver");
    expect(REGISTRATION_SIGNATURES).toContain("nameservers");
    expect(REGISTRATION_SIGNATURES).toContain("status: active");
  });
});