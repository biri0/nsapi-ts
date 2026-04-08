import { NSApiClient } from "../client";
import type { NSApiResponse, VerifyRequest } from "../types";

export class VerifyResource {
  constructor(private readonly client: NSApiClient) {}

  check(request: VerifyRequest, signal?: AbortSignal): Promise<NSApiResponse> {
    return this.client.verify(
      request.nation,
      request.checksum,
      request.token,
      request.shards,
      request.params,
      signal,
    );
  }
}
