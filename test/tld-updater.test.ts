import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { updateTldList, parseTldList, TLD_URL } from "../src/tld-updater";

describe("parseTldList", () => {
  test("filters comment lines starting with #", () => {
    const input = `# IANA TLD list
# Version: 2024010100
com
org
net`;
    
    const result = parseTldList(input);
    
    expect(result).toEqual([".com", ".org", ".net"]);
  });

  test("converts to lowercase", () => {
    const input = `COM
ORG
NET
IO`;
    
    const result = parseTldList(input);
    
    expect(result).toEqual([".com", ".org", ".net", ".io"]);
  });

  test("prepends dot to each TLD", () => {
    const input = `com
org`;
    
    const result = parseTldList(input);
    
    expect(result).toEqual([".com", ".org"]);
  });

  test("handles empty lines", () => {
    const input = `com

org

net`;
    
    const result = parseTldList(input);
    
    expect(result).toEqual([".com", ".org", ".net"]);
  });

  test("handles trailing whitespace", () => {
    const input = `com   
org  
net  `;
    
    const result = parseTldList(input);
    
    expect(result).toEqual([".com", ".org", ".net"]);
  });

  test("returns empty array for empty input", () => {
    const result = parseTldList("");
    expect(result).toEqual([]);
  });

  test("returns empty array for only comments", () => {
    const result = parseTldList("# only comments\n# no TLDs");
    expect(result).toEqual([]);
  });
});

describe("updateTldList", () => {
  const mockFetch = mock(() => {});

  beforeEach(() => {
    mock.restore();
  });

  afterEach(() => {
    mock.restore();
  });

  test("fetches from IANA URL", async () => {
    const mockResponse = "# Test\ncom\norg";
    
    const fetcher = () => Promise.resolve(mockResponse);
    const writer = mock(() => {});
    
    await updateTldList(fetcher, writer, "tlds.txt");
    
    expect(writer).toHaveBeenCalledWith("tlds.txt", ".com\n.org\n");
  });

  test("writes to specified file path", async () => {
    const mockResponse = "com\nnet";
    const fetcher = () => Promise.resolve(mockResponse);
    const writer = mock(() => {});
    
    await updateTldList(fetcher, writer, "custom-tlds.txt");
    
    expect(writer).toHaveBeenCalledWith("custom-tlds.txt", ".com\n.net\n");
  });

  test("returns count of TLDs fetched", async () => {
    const mockResponse = "com\norg\nnet\n";
    const fetcher = () => Promise.resolve(mockResponse);
    const writer = mock(() => {});
    
    const result = await updateTldList(fetcher, writer, "tlds.txt");
    
    expect(result.count).toBe(3);
  });
});

describe("TLD_URL", () => {
  test("points to IANA TLD data", () => {
    expect(TLD_URL).toBe("https://data.iana.org/TLD/tlds-alpha-by-domain.txt");
  });
});