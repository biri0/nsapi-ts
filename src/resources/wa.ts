import { NSApiClient } from "../client";
import type { NSApiResponse, WARequest } from "../types";

export class WAResource {
  constructor(private readonly client: NSApiClient) {}

  get(request: WARequest, signal?: AbortSignal): Promise<NSApiResponse> {
    return this.client.wa(
      request.councilId,
      request.shards,
      request.id,
      request.params,
      signal,
    );
  }
}
