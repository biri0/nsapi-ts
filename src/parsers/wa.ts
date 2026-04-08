import type { NSApiResponse } from "../types";
import type { ParsedByShards, WAShardMap, WAResolutionData } from "./types";
import {
  ensureSupportedShard,
  readTagAttribute,
  readTagBlock,
  readNumberRequired,
  readTextOptional,
  splitList,
  throwOnApiErrorTag,
} from "./xml-helpers";

type WAShard = keyof WAShardMap;

const SUPPORTED_SHARDS = new Set<WAShard>([
  "numnations",
  "numdelegates",
  "delegates",
  "members",
  "resolution",
]);

const parseResolution = (xml: string): WAResolutionData => {
  const block = readTagBlock(xml, "RESOLUTION");
  if (!block) {
    return {};
  }

  const idText = readTagAttribute(block, "RESOLUTION", "id");
  const id = idText ? Number(idText) : undefined;

  return {
    id: Number.isFinite(id) ? id : undefined,
    name: readTextOptional(block, "NAME"),
    category: readTextOptional(block, "CATEGORY"),
    desc: readTextOptional(block, "DESC"),
    proposer: readTextOptional(block, "PROPOSED_BY") ?? readTextOptional(block, "PROPOSER"),
  };
};

export const parseWA = <TShards extends readonly WAShard[]>(
  xml: string,
  shards: TShards,
): ParsedByShards<WAShardMap, TShards> => {
  throwOnApiErrorTag("wa", xml);
  const result: Partial<WAShardMap> = {};

  for (const shard of shards) {
    ensureSupportedShard("wa", shard, SUPPORTED_SHARDS, xml);

    switch (shard) {
      case "numnations":
        result.numnations = readNumberRequired(xml, "NUMNATIONS", {
          resource: "wa",
          shard,
          xml,
        });
        break;
      case "numdelegates":
        result.numdelegates = readNumberRequired(xml, "NUMDELEGATES", {
          resource: "wa",
          shard,
          xml,
        });
        break;
      case "delegates": {
        const delegates = readTextOptional(xml, "DELEGATES");
        result.delegates = splitList(delegates, ",");
        break;
      }
      case "members": {
        const members = readTextOptional(xml, "MEMBERS");
        result.members = splitList(members, ",");
        break;
      }
      case "resolution":
        result.resolution = parseResolution(xml);
        break;
    }
  }

  return result as ParsedByShards<WAShardMap, TShards>;
};

export const parseWAResponse = <TShards extends readonly WAShard[]>(
  response: NSApiResponse,
  shards: TShards,
): ParsedByShards<WAShardMap, TShards> => {
  return parseWA(response.xml, shards);
};
