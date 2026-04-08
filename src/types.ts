export type QueryValue = string | number | boolean;

export type ExtraParams = Record<string, QueryValue | undefined>;

export interface NSApiRateLimit {
  policy?: string;
  limit?: number;
  remaining?: number;
  reset?: number;
  retryAfter?: number;
}

export interface NSApiResponse {
  status: number;
  url: string;
  xml: string;
  rateLimit: NSApiRateLimit;
  headers: Headers;
}

export interface NSApiClientOptions {
  userAgent: string;
  baseUrl?: string;
  apiVersion?: number;
  maxRetries?: number;
  fetchImpl?: (input: string | URL, init?: RequestInit) => Promise<Response>;
}

export interface NationRequest {
  nation: string;
  shards?: string | string[];
  params?: ExtraParams;
}

export interface RegionRequest {
  region: string;
  shards?: string | string[];
  params?: ExtraParams;
}

export interface WorldRequest {
  shards?: string | string[];
  params?: ExtraParams;
}

export interface WARequest {
  councilId: 1 | 2;
  shards?: string | string[];
  id?: number;
  params?: ExtraParams;
}
