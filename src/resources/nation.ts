import { NSApiClient } from "../client";
import type {
  NationIssueCommandRequest,
  NationPrivateRequest,
  NationRequest,
  NSApiResponse,
} from "../types";

export class NationResource {
  constructor(private readonly client: NSApiClient) {}

  get(request: NationRequest, signal?: AbortSignal): Promise<NSApiResponse> {
    return this.client.nation(request.nation, request.shards, request.params, signal);
  }

  getPrivate(request: NationPrivateRequest, signal?: AbortSignal): Promise<NSApiResponse> {
    return this.client.nationPrivate(
      request.nation,
      request.shards,
      request.params,
      request.auth,
      signal,
    );
  }

  issue(request: NationIssueCommandRequest, signal?: AbortSignal): Promise<NSApiResponse> {
    return this.client.nationIssueCommand(
      request.nation,
      request.issue,
      request.option,
      request.params,
      request.auth,
      signal,
    );
  }
}
