import type { NSApiResponse } from "../types";
import type { ParsedByShards, WAShardMap, WAResolutionData, WAVoteEntry } from "./types";
import {
  ensureSupportedShard,
  readAnyTagAttribute,
  readTagAttribute,
  readTagBlock,
  readTagBlocks,
  readSimpleTagTexts,
  readNumberRequired,
  readTextOptional,
  splitList,
  toNumberOptional,
  throwOnApiErrorTag,
} from "./xml-helpers";

type WAShard = keyof WAShardMap;

const SUPPORTED_SHARDS = new Set<WAShard>([
  "numnations",
  "numdelegates",
  "delegates",
  "members",
  "resolution",
  "voters",
  "votetrack",
  "dellog",
  "delvotes",
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

const parseVoteEntry = (entryXml: string): WAVoteEntry => {
  const nation =
    readAnyTagAttribute(entryXml, "nation") ??
    readTextOptional(entryXml, "NATION") ??
    readTextOptional(entryXml, "NAME");
  const delegate =
    readAnyTagAttribute(entryXml, "delegate") ??
    readTextOptional(entryXml, "DELEGATE") ??
    readTextOptional(entryXml, "NATION") ??
    nation;

  return {
    nation,
    delegate,
    vote: readAnyTagAttribute(entryXml, "vote") ?? readTextOptional(entryXml, "VOTE"),
    timestamp:
      toNumberOptional(readAnyTagAttribute(entryXml, "timestamp")) ??
      toNumberOptional(readTextOptional(entryXml, "TIMESTAMP")),
  };
};

const parseVoteEntriesFromBlock = (xml: string, blockTag: string): WAVoteEntry[] => {
  const block = readTagBlock(xml, blockTag);
  if (!block) {
    return [];
  }

  const explicitEntries = readTagBlocks(block, "ENTRY");
  if (explicitEntries.length > 0) {
    return explicitEntries.map(parseVoteEntry);
  }

  const delegates = readTagBlocks(block, "DELEGATE");
  if (delegates.length > 0) {
    return delegates.map(parseVoteEntry);
  }

  const nations = readTagBlocks(block, "NATION");
  if (nations.length > 0) {
    const voteTexts = readSimpleTagTexts(block, "VOTE");
    return nations.map((nationXml, index) => ({
      nation: readTextOptional(nationXml, "NATION"),
      delegate: readTextOptional(nationXml, "NATION"),
      vote: voteTexts[index],
    }));
  }

  const votes = readTagBlocks(block, "VOTE");
  return votes.map(parseVoteEntry);
};

const parseVoters = (xml: string): string[] => {
  const voters = readTextOptional(xml, "VOTERS");
  return splitList(voters, ",");
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
      case "voters":
        result.voters = parseVoters(xml);
        break;
      case "votetrack":
        result.votetrack = parseVoteEntriesFromBlock(xml, "VOTETRACK");
        break;
      case "dellog":
        result.dellog = parseVoteEntriesFromBlock(xml, "DELLOG");
        break;
      case "delvotes":
        result.delvotes = parseVoteEntriesFromBlock(xml, "DELVOTES");
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
