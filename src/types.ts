export interface DomainResult {
  keyword: string;
  tld: string;
  available: boolean;
  expiresAt: number | null;
}

export interface JsonOutput {
  domain: string;
  available: boolean;
}

export interface CheckOptions {
  keywords: string[];
  tlds: string[];
  availableOnly: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface UpdateResult {
  count: number;
  file: string;
}

export interface CachedResult {
  domain: string;
  available: boolean;
  checkedAt: number;
  expiresAt: number | null;
}

export interface CacheOptions {
  enabled: boolean;
  ttlMs: number;
}