import type { NSApiResponse } from "../types";
import type { ParsedByShards, RegionShardMap } from "./types";
import {
  ensureSupportedShard,
  readNumberRequired,
  readTextOptional,
  readTextRequired,
  splitList,
  throwOnApiErrorTag,
} from "./xml-helpers";

type RegionShard = keyof RegionShardMap;

const SUPPORTED_SHARDS = new Set<RegionShard>([
  "name",
  "numnations",
  "delegate",
  "delegatevotes",
  "nations",
  "wanations",
  "power",
]);

export const parseRegion = <TShards extends readonly RegionShard[]>(
  xml: string,
  shards: TShards,
): ParsedByShards<RegionShardMap, TShards> => {
  throwOnApiErrorTag("region", xml);
  const result: Partial<RegionShardMap> = {};

  for (const shard of shards) {
    ensureSupportedShard("region", shard, SUPPORTED_SHARDS, xml);

    switch (shard) {
      case "name":
        result.name = readTextRequired(xml, "NAME", { resource: "region", shard, xml });
        break;
      case "numnations":
        result.numnations = readNumberRequired(xml, "NUMNATIONS", {
          resource: "region",
          shard,
          xml,
        });
        break;
      case "delegate":
        result.delegate = readTextRequired(xml, "DELEGATE", { resource: "region", shard, xml });
        break;
      case "delegatevotes":
        result.delegatevotes = readNumberRequired(xml, "DELEGATEVOTES", {
          resource: "region",
          shard,
          xml,
        });
        break;
      case "nations": {
        const nations = readTextOptional(xml, "NATIONS");
        result.nations = splitList(nations, ":");
        break;
      }
      case "wanations": {
        const waNations = readTextOptional(xml, "UNNATIONS");
        result.wanations = splitList(waNations, ",");
        break;
      }
      case "power":
        result.power = readTextRequired(xml, "POWER", { resource: "region", shard, xml });
        break;
    }
  }

  return result as ParsedByShards<RegionShardMap, TShards>;
};

export const parseRegionResponse = <TShards extends readonly RegionShard[]>(
  response: NSApiResponse,
  shards: TShards,
): ParsedByShards<RegionShardMap, TShards> => {
  return parseRegion(response.xml, shards);
};
