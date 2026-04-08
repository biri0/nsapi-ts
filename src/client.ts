import type {
  ExtraParams,
  NSApiClientOptions,
  NSApiRateLimit,
  NSApiResponse,
} from "./types";

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
}

export class NSApiClient {
  readonly userAgent: string;
  readonly baseUrl: string;
  readonly apiVersion?: number;
  readonly maxRetries: number;

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
        headers: {
          "User-Agent": this.userAgent,
        },
      });

      const xml = await response.text();
      const rateLimit = readRateLimit(response.headers);

      if (response.status === 429 && attempt < this.maxRetries) {
        const retryAfterMs = (rateLimit.retryAfter ?? 1) * 1000;
        attempt += 1;
        await sleep(retryAfterMs);
        continue;
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
      };
    }
  }
}
