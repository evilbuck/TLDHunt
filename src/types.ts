export interface DomainResult {
  keyword: string;
  tld: string;
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