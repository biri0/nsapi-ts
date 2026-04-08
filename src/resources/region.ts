import { NSApiClient } from "../client";
import type { RegionRequest, NSApiResponse } from "../types";

export class RegionResource {
  constructor(private readonly client: NSApiClient) {}

  get(request: RegionRequest, signal?: AbortSignal): Promise<NSApiResponse> {
    return this.client.region(request.region, request.shards, request.params, signal);
  }
}
