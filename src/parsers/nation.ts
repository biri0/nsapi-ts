import type { NSApiResponse } from "../types";
import type { NationShardMap, ParsedByShards } from "./types";
import {
  ensureSupportedShard,
  readNumberRequired,
  readTextOptional,
  readTextRequired,
  splitList,
  throwOnApiErrorTag,
} from "./xml-helpers";

type NationShard = keyof NationShardMap;

const SUPPORTED_SHARDS = new Set<NationShard>([
  "name",
  "region",
  "population",
  "wa",
  "motto",
  "category",
  "endorsements",
]);

export const parseNation = <TShards extends readonly NationShard[]>(
  xml: string,
  shards: TShards,
): ParsedByShards<NationShardMap, TShards> => {
  throwOnApiErrorTag("nation", xml);
  const result: Partial<NationShardMap> = {};

  for (const shard of shards) {
    ensureSupportedShard("nation", shard, SUPPORTED_SHARDS, xml);

    switch (shard) {
      case "name":
        result.name = readTextRequired(xml, "NAME", { resource: "nation", shard, xml });
        break;
      case "region":
        result.region = readTextRequired(xml, "REGION", { resource: "nation", shard, xml });
        break;
      case "population":
        result.population = readNumberRequired(xml, "POPULATION", {
          resource: "nation",
          shard,
          xml,
        });
        break;
      case "wa":
        result.wa = readTextRequired(xml, "UNSTATUS", { resource: "nation", shard, xml });
        break;
      case "motto":
        result.motto = readTextRequired(xml, "MOTTO", { resource: "nation", shard, xml });
        break;
      case "category":
        result.category = readTextRequired(xml, "CATEGORY", {
          resource: "nation",
          shard,
          xml,
        });
        break;
      case "endorsements": {
        const endorsements = readTextOptional(xml, "ENDORSEMENTS");
        result.endorsements = splitList(endorsements, ",");
        break;
      }
    }
  }

  return result as ParsedByShards<NationShardMap, TShards>;
};

export const parseNationResponse = <TShards extends readonly NationShard[]>(
  response: NSApiResponse,
  shards: TShards,
): ParsedByShards<NationShardMap, TShards> => {
  return parseNation(response.xml, shards);
};
