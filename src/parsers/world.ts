import type { NSApiResponse } from "../types";
import type { ParsedByShards, WorldShardMap } from "./types";
import {
  ensureSupportedShard,
  readNumberRequired,
  readTextOptional,
  readTextRequired,
  splitList,
  throwOnApiErrorTag,
} from "./xml-helpers";

type WorldShard = keyof WorldShardMap;

const SUPPORTED_SHARDS = new Set<WorldShard>([
  "numnations",
  "numregions",
  "featuredregion",
  "newnations",
  "lasteventid",
]);

export const parseWorld = <TShards extends readonly WorldShard[]>(
  xml: string,
  shards: TShards,
): ParsedByShards<WorldShardMap, TShards> => {
  throwOnApiErrorTag("world", xml);
  const result: Partial<WorldShardMap> = {};

  for (const shard of shards) {
    ensureSupportedShard("world", shard, SUPPORTED_SHARDS, xml);

    switch (shard) {
      case "numnations":
        result.numnations = readNumberRequired(xml, "NUMNATIONS", {
          resource: "world",
          shard,
          xml,
        });
        break;
      case "numregions":
        result.numregions = readNumberRequired(xml, "NUMREGIONS", {
          resource: "world",
          shard,
          xml,
        });
        break;
      case "featuredregion":
        result.featuredregion = readTextRequired(xml, "FEATUREDREGION", {
          resource: "world",
          shard,
          xml,
        });
        break;
      case "newnations": {
        const newNations = readTextOptional(xml, "NEWNATIONS");
        result.newnations = splitList(newNations, ",");
        break;
      }
      case "lasteventid":
        result.lasteventid = readNumberRequired(xml, "LASTEVENTID", {
          resource: "world",
          shard,
          xml,
        });
        break;
    }
  }

  return result as ParsedByShards<WorldShardMap, TShards>;
};

export const parseWorldResponse = <TShards extends readonly WorldShard[]>(
  response: NSApiResponse,
  shards: TShards,
): ParsedByShards<WorldShardMap, TShards> => {
  return parseWorld(response.xml, shards);
};
