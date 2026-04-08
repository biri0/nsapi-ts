import { NSApiClient } from "./client";
import { NationResource } from "./resources/nation";
import { RegionResource } from "./resources/region";
import { WAResource } from "./resources/wa";
import { WorldResource } from "./resources/world";
import type { NSApiClientOptions } from "./types";

export * from "./client";
export * from "./types";
export * from "./xml";

export class NationStates {
  readonly client: NSApiClient;
  readonly nation: NationResource;
  readonly region: RegionResource;
  readonly world: WorldResource;
  readonly wa: WAResource;

  constructor(options: NSApiClientOptions) {
    this.client = new NSApiClient(options);
    this.nation = new NationResource(this.client);
    this.region = new RegionResource(this.client);
    this.world = new WorldResource(this.client);
    this.wa = new WAResource(this.client);
  }
}
