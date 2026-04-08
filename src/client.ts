import type {
  ExtraParams,
  NSAuthState,
  NSApiClientOptions,
  NSApiRateLimit,
  NSApiResponse,
  NSRequestAuth,
} from "./types";
import { NSAuthError } from "./errors";

const DEFAULT_BASE_URL = "https://www.nationstates.net/cgi-bin/api.cgi";
const DEFAULT_MAX_RETRIES = 2;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toNumber = (value: string | null): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const normalizeName = (value: string): string => {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
};

const serializeShards = (shards: string | string[] | undefined): string | undefined => {
  if (!shards) {
    return undefined;
  }

  if (Array.isArray(shards)) {
    return shards.join("+");
  }

  return shards;
};

const setSearchParams = (searchParams: URLSearchParams, params?: ExtraParams): void => {
  if (!params) {
    return;
  }

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue;
    }

    searchParams.set(key, String(value));
  }
};

const readRateLimit = (headers: Headers): NSApiRateLimit => ({
  policy: headers.get("RateLimit-Policy") ?? undefined,
  limit: toNumber(headers.get("RateLimit-Limit")),
  remaining: toNumber(headers.get("RateLimit-Remaining")),
  reset: toNumber(headers.get("RateLimit-Reset")),
  retryAfter: toNumber(headers.get("Retry-After")),
});

interface RequestOptions {
  params: URLSearchParams;
  signal?: AbortSignal;
  auth?: NSRequestAuth;
}

export class NSApiClient {
  readonly userAgent: string;
  readonly baseUrl: string;
  readonly apiVersion?: number;
  readonly maxRetries: number;

  private auth: NSAuthState;

  private readonly fetchImpl: (input: string | URL, init?: RequestInit) => Promise<Response>;

  constructor(options: NSApiClientOptions) {
    if (!options.userAgent.trim()) {
      throw new Error("A non-empty userAgent is required by the NationStates API");
    }

    this.userAgent = options.userAgent;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.apiVersion = options.apiVersion;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.auth = { ...options.auth };
  }

  getAuthState(): NSAuthState {
    return { ...this.auth };
  }

  async nation(
    nation: string,
    shards?: string | string[],
    params?: ExtraParams,
    signal?: AbortSignal,
  ): Promise<NSApiResponse> {
    const searchParams = new URLSearchParams();
    searchParams.set("nation", normalizeName(nation));

    const q = serializeShards(shards);
    if (q) {
      searchParams.set("q", q);
    }

    setSearchParams(searchParams, params);
    return this.request({ params: searchParams, signal });
  }

  async region(
    region: string,
    shards?: string | string[],
    params?: ExtraParams,
    signal?: AbortSignal,
  ): Promise<NSApiResponse> {
    const searchParams = new URLSearchParams();
    searchParams.set("region", normalizeName(region));

    const q = serializeShards(shards);
    if (q) {
      searchParams.set("q", q);
    }

    setSearchParams(searchParams, params);
    return this.request({ params: searchParams, signal });
  }

  async world(
    shards?: string | string[],
    params?: ExtraParams,
    signal?: AbortSignal,
  ): Promise<NSApiResponse> {
    const searchParams = new URLSearchParams();

    const q = serializeShards(shards);
    if (q) {
      searchParams.set("q", q);
    }

    setSearchParams(searchParams, params);
    return this.request({ params: searchParams, signal });
  }

  async wa(
    councilId: 1 | 2,
    shards?: string | string[],
    id?: number,
    params?: ExtraParams,
    signal?: AbortSignal,
  ): Promise<NSApiResponse> {
    const searchParams = new URLSearchParams();
    searchParams.set("wa", String(councilId));

    const q = serializeShards(shards);
    if (q) {
      searchParams.set("q", q);
    }

    if (id !== undefined) {
      searchParams.set("id", String(id));
    }

    setSearchParams(searchParams, params);
    return this.request({ params: searchParams, signal });
  }

  async nationPrivate(
    nation: string,
    shards: string | string[],
    params?: ExtraParams,
    auth?: NSRequestAuth,
    signal?: AbortSignal,
  ): Promise<NSApiResponse> {
    const effectiveAuth = {
      ...this.auth,
      ...auth,
    };

    if (!effectiveAuth.pin && !effectiveAuth.autologin && !effectiveAuth.password) {
      throw new NSAuthError(
        "Private Nation API requests require one of X-Pin, X-Autologin, or X-Password",
      );
    }

    const searchParams = new URLSearchParams();
    searchParams.set("nation", normalizeName(nation));
    searchParams.set("q", serializeShards(shards) ?? "");

    setSearchParams(searchParams, params);
    return this.request({ params: searchParams, auth, signal });
  }

  async nationIssueCommand(
    nation: string,
    issue: number,
    option: number,
    params?: ExtraParams,
    auth?: NSRequestAuth,
    signal?: AbortSignal,
  ): Promise<NSApiResponse> {
    const effectiveAuth = {
      ...this.auth,
      ...auth,
    };

    if (!effectiveAuth.pin && !effectiveAuth.autologin && !effectiveAuth.password) {
      throw new NSAuthError(
        "Private Nation commands require one of X-Pin, X-Autologin, or X-Password",
      );
    }

    const searchParams = new URLSearchParams();
    searchParams.set("nation", normalizeName(nation));
    searchParams.set("c", "issue");
    searchParams.set("issue", String(issue));
    searchParams.set("option", String(option));

    setSearchParams(searchParams, params);
    return this.request({ params: searchParams, auth, signal });
  }

  async verify(
    nation: string,
    checksum: string,
    token?: string,
    shards?: string | string[],
    params?: ExtraParams,
    signal?: AbortSignal,
  ): Promise<NSApiResponse> {
    const searchParams = new URLSearchParams();
    searchParams.set("a", "verify");
    searchParams.set("nation", normalizeName(nation));
    searchParams.set("checksum", checksum);

    if (token) {
      searchParams.set("token", token);
    }

    const q = serializeShards(shards);
    if (q) {
      searchParams.set("q", q);
    }

    setSearchParams(searchParams, params);
    return this.request({ params: searchParams, signal });
  }

  private buildAuthHeaders(authOverride?: NSRequestAuth): HeadersInit {
    const effective = {
      ...this.auth,
      ...authOverride,
    };

    const headers: Record<string, string> = {
      "User-Agent": this.userAgent,
    };

    if (effective.pin) {
      headers["X-Pin"] = effective.pin;
    }

    if (effective.autologin) {
      headers["X-Autologin"] = effective.autologin;
    }

    if (effective.password) {
      headers["X-Password"] = effective.password;
    }

    return headers;
  }

  private captureAuthHeaders(headers: Headers): void {
    const pin = headers.get("X-Pin");
    const autologin = headers.get("X-Autologin");

    if (pin) {
      this.auth.pin = pin;
    }

    if (autologin) {
      this.auth.autologin = autologin;
    }
  }

  private async request(options: RequestOptions): Promise<NSApiResponse> {
    if (this.apiVersion !== undefined && !options.params.has("v")) {
      options.params.set("v", String(this.apiVersion));
    }

    const url = new URL(this.baseUrl);
    url.search = options.params.toString();

    let attempt = 0;
    while (true) {
      const response = await this.fetchImpl(url, {
        method: "GET",
        signal: options.signal,
        headers: this.buildAuthHeaders(options.auth),
      });

      const xml = await response.text();
      const rateLimit = readRateLimit(response.headers);
      this.captureAuthHeaders(response.headers);

      if (response.status === 429 && attempt < this.maxRetries) {
        const retryAfterMs = (rateLimit.retryAfter ?? 1) * 1000;
        attempt += 1;
        await sleep(retryAfterMs);
        continue;
      }

      if (response.status === 409) {
        throw new NSAuthError(
          "NationStates authentication conflict (409). Reuse X-Pin for rapid successive private requests.",
          409,
        );
      }

      if (!response.ok) {
        throw new Error(
          `NationStates API error ${response.status}: ${xml.slice(0, 500)}`,
        );
      }

      return {
        status: response.status,
        url: url.toString(),
        xml,
        rateLimit,
        headers: response.headers,
        auth: this.getAuthState(),
      };
    }
  }
}
