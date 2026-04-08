import type { NSApiResponse } from "../types";
import type {
  CensusData,
  CensusScaleData,
  HappeningEvent,
  HappeningsData,
  NationShardMap,
  ParsedByShards,
} from "./types";
import {
  ensureSupportedShard,
  readTagAttribute,
  readTagBlock,
  readTagBlocks,
  readTagText,
  readNumberRequired,
  readTextOptional,
  readTextRequired,
  splitList,
  toNumberOptional,
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
  "census",
  "happenings",
]);

const parseCensusScale = (scaleXml: string): CensusScaleData => {
  const historyContainer = readTagBlock(scaleXml, "HISTORY");
  const historyPoints = historyContainer
    ? readTagBlocks(historyContainer, "POINT").map((pointXml) => ({
        timestamp:
          toNumberOptional(readTagAttribute(pointXml, "POINT", "timestamp")) ??
          toNumberOptional(readTagText(pointXml, "TIMESTAMP")),
        score:
          toNumberOptional(readTagAttribute(pointXml, "POINT", "score")) ??
          toNumberOptional(readTagText(pointXml, "SCORE")),
      }))
    : [];

  return {
    id: toNumberOptional(readTagAttribute(scaleXml, "SCALE", "id")),
    score: toNumberOptional(readTextOptional(scaleXml, "SCORE")),
    rank: toNumberOptional(readTextOptional(scaleXml, "RANK")),
    regionRank: toNumberOptional(readTextOptional(scaleXml, "RRANK")),
    worldPercentRank: toNumberOptional(readTextOptional(scaleXml, "PRANK")),
    regionPercentRank: toNumberOptional(readTextOptional(scaleXml, "PRRANK")),
    history: historyPoints,
  };
};

const parseCensus = (xml: string): CensusData => {
  const censusBlock = readTagBlock(xml, "CENSUS");
  if (!censusBlock) {
    return { scales: [] };
  }

  const scales = readTagBlocks(censusBlock, "SCALE").map(parseCensusScale);
  return { scales };
};

const parseHappenings = (xml: string): HappeningsData => {
  const happeningsBlock = readTagBlock(xml, "HAPPENINGS");
  if (!happeningsBlock) {
    return { events: [] };
  }

  const events = readTagBlocks(happeningsBlock, "EVENT").map((eventXml): HappeningEvent => ({
    id: toNumberOptional(readTagAttribute(eventXml, "EVENT", "id")),
    timestamp:
      toNumberOptional(readTagAttribute(eventXml, "EVENT", "timestamp")) ??
      toNumberOptional(readTextOptional(eventXml, "TIMESTAMP")),
    text: readTextOptional(eventXml, "TEXT") ?? readTextOptional(eventXml, "STR"),
    type: readTextOptional(eventXml, "TYPE"),
  }));

  return { events };
};

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
      case "census":
        result.census = parseCensus(xml);
        break;
      case "happenings":
        result.happenings = parseHappenings(xml);
        break;
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
