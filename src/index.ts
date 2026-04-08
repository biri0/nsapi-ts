import { NSApiClient } from "./client";
import { NationResource } from "./resources/nation";
import { RegionResource } from "./resources/region";
import { VerifyResource } from "./resources/verify";
import { WAResource } from "./resources/wa";
import { WorldResource } from "./resources/world";
import type { NSApiClientOptions } from "./types";

export * from "./client";
export * from "./errors";
export * from "./types";
export * from "./xml";
export * from "./parsers/errors";
export * from "./parsers/types";
export * from "./parsers/nation";
export * from "./parsers/nation-private";
export * from "./parsers/commands";
export * from "./parsers/region";
export * from "./parsers/verify";
export * from "./parsers/world";
export * from "./parsers/wa";

export class NationStates {
  readonly client: NSApiClient;
  readonly nation: NationResource;
  readonly region: RegionResource;
  readonly world: WorldResource;
  readonly wa: WAResource;
  readonly verify: VerifyResource;

  constructor(options: NSApiClientOptions) {
    this.client = new NSApiClient(options);
    this.nation = new NationResource(this.client);
    this.region = new RegionResource(this.client);
    this.world = new WorldResource(this.client);
    this.wa = new WAResource(this.client);
    this.verify = new VerifyResource(this.client);
  }
}
