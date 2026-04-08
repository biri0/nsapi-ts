import { NSApiClient } from "../client";
import type { NationRequest, NSApiResponse } from "../types";

export class NationResource {
  constructor(private readonly client: NSApiClient) {}

  get(request: NationRequest, signal?: AbortSignal): Promise<NSApiResponse> {
    return this.client.nation(request.nation, request.shards, request.params, signal);
  }
}
