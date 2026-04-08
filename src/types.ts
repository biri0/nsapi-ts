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
  auth: NSAuthState;
}

export interface NSAuthState {
  pin?: string;
  autologin?: string;
  password?: string;
}

export interface NSRequestAuth {
  pin?: string;
  autologin?: string;
  password?: string;
}

export interface NSApiClientOptions {
  userAgent: string;
  baseUrl?: string;
  apiVersion?: number;
  maxRetries?: number;
  fetchImpl?: (input: string | URL, init?: RequestInit) => Promise<Response>;
  auth?: NSAuthState;
}

export interface NationRequest {
  nation: string;
  shards?: string | string[];
  params?: ExtraParams;
}

export interface NationPrivateRequest {
  nation: string;
  shards: string | string[];
  params?: ExtraParams;
  auth?: NSRequestAuth;
}

export interface NationIssueCommandRequest {
  nation: string;
  issue: number;
  option: number;
  params?: ExtraParams;
  auth?: NSRequestAuth;
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

export interface VerifyRequest {
  nation: string;
  checksum: string;
  token?: string;
  shards?: string | string[];
  params?: ExtraParams;
}
