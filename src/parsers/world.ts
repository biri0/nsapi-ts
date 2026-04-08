import type { NSApiResponse } from "../types";
import type {
  CensusData,
  CensusScaleData,
  HappeningEvent,
  HappeningsData,
  ParsedByShards,
  WorldShardMap,
} from "./types";
import {
  ensureSupportedShard,
  readAnyTagAttribute,
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

type WorldShard = keyof WorldShardMap;

const SUPPORTED_SHARDS = new Set<WorldShard>([
  "numnations",
  "numregions",
  "featuredregion",
  "newnations",
  "lasteventid",
  "census",
  "happenings",
  "dispatchlist",
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

const parseDispatchList = (xml: string) => {
  const dispatchListBlock = readTagBlock(xml, "DISPATCHLIST");
  if (!dispatchListBlock) {
    return { dispatches: [] };
  }

  const entries = readTagBlocks(dispatchListBlock, "DISPATCH").map((dispatchXml) => ({
    id: toNumberOptional(readAnyTagAttribute(dispatchXml, "id") ?? readTextOptional(dispatchXml, "ID")),
    title: readAnyTagAttribute(dispatchXml, "title") ?? readTextOptional(dispatchXml, "TITLE"),
    author: readAnyTagAttribute(dispatchXml, "author") ?? readTextOptional(dispatchXml, "AUTHOR"),
    category:
      readAnyTagAttribute(dispatchXml, "category") ?? readTextOptional(dispatchXml, "CATEGORY"),
    subcategory:
      readAnyTagAttribute(dispatchXml, "subcategory") ?? readTextOptional(dispatchXml, "SUBCATEGORY"),
    created:
      toNumberOptional(readAnyTagAttribute(dispatchXml, "created") ?? readTextOptional(dispatchXml, "CREATED")),
    edited:
      toNumberOptional(readAnyTagAttribute(dispatchXml, "edited") ?? readTextOptional(dispatchXml, "EDITED")),
    score: toNumberOptional(readAnyTagAttribute(dispatchXml, "score") ?? readTextOptional(dispatchXml, "SCORE")),
    views: toNumberOptional(readAnyTagAttribute(dispatchXml, "views") ?? readTextOptional(dispatchXml, "VIEWS")),
  }));

  return { dispatches: entries };
};

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
      case "census":
        result.census = parseCensus(xml);
        break;
      case "happenings":
        result.happenings = parseHappenings(xml);
        break;
      case "dispatchlist":
        result.dispatchlist = parseDispatchList(xml);
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
