import { NSApiClient } from "../client";
import type { NSApiResponse, WorldRequest } from "../types";

export class WorldResource {
  constructor(private readonly client: NSApiClient) {}

  get(request: WorldRequest = {}, signal?: AbortSignal): Promise<NSApiResponse> {
    return this.client.world(request.shards, request.params, signal);
  }
}
