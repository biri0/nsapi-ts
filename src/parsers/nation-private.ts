import type { NSApiResponse } from "../types";
import type {
  NationPrivateShardMap,
  NationIssueData,
  NationIssueOption,
  ParsedByShards,
} from "./types";
import {
  ensureSupportedShard,
  readAnyTagAttribute,
  readTagAttribute,
  readTagBlock,
  readTagBlocks,
  readNumberRequired,
  readTextOptional,
  throwOnApiErrorTag,
  toNumberOptional,
} from "./xml-helpers";

type NationPrivateShard = keyof NationPrivateShardMap;

const SUPPORTED_PRIVATE_SHARDS = new Set<NationPrivateShard>([
  "issues",
  "issuesummary",
  "nextissue",
  "nextissuetime",
  "notices",
  "unread",
]);

const parseIssueOption = (xml: string): NationIssueOption => {
  const id =
    toNumberOptional(readAnyTagAttribute(xml, "id")) ?? toNumberOptional(readTextOptional(xml, "ID"));

  return {
    id: id ?? -1,
    text: readTextOptional(xml, "TEXT") ?? readTextOptional(xml, "OPTION"),
  };
};

const parseIssue = (xml: string): NationIssueData => {
  const id =
    toNumberOptional(readAnyTagAttribute(xml, "id")) ?? toNumberOptional(readTextOptional(xml, "ID"));

  const optionBlocks = readTagBlocks(xml, "OPTION");
  const options = optionBlocks.map(parseIssueOption).filter((entry) => entry.id >= 0);

  return {
    id: id ?? -1,
    title: readTextOptional(xml, "TITLE"),
    text: readTextOptional(xml, "TEXT"),
    author: readTextOptional(xml, "AUTHOR"),
    editor: readTextOptional(xml, "EDITOR"),
    pic1: readTextOptional(xml, "PIC1"),
    pic2: readTextOptional(xml, "PIC2"),
    options,
  };
};

const parseIssues = (xml: string) => {
  const issuesBlock = readTagBlock(xml, "ISSUES");
  if (!issuesBlock) {
    return { issues: [] };
  }

  const issues = readTagBlocks(issuesBlock, "ISSUE").map(parseIssue).filter((issue) => issue.id >= 0);
  return { issues };
};

const parseIssueSummary = (xml: string) => {
  const issueSummaryBlock = readTagBlock(xml, "ISSUESUMMARY");
  if (!issueSummaryBlock) {
    return { issues: [] };
  }

  const issues = readTagBlocks(issueSummaryBlock, "ISSUE")
    .map((issueXml) => ({
      id:
        toNumberOptional(readAnyTagAttribute(issueXml, "id")) ??
        toNumberOptional(readTextOptional(issueXml, "ID")) ??
        -1,
      title: readTextOptional(issueXml, "TITLE"),
      optionCount:
        toNumberOptional(readAnyTagAttribute(issueXml, "optioncount")) ??
        toNumberOptional(readTextOptional(issueXml, "OPTIONCOUNT")),
    }))
    .filter((issue) => issue.id >= 0);

  return { issues };
};

const parseNotices = (xml: string) => {
  const noticesBlock = readTagBlock(xml, "NOTICES");
  if (!noticesBlock) {
    return { notices: [] };
  }

  const notices = readTagBlocks(noticesBlock, "NOTICE").map((noticeXml) => ({
    id: toNumberOptional(readAnyTagAttribute(noticeXml, "id")) ?? toNumberOptional(readTextOptional(noticeXml, "ID")),
    text: readTextOptional(noticeXml, "TEXT") ?? readTextOptional(noticeXml, "STR"),
    timestamp:
      toNumberOptional(readAnyTagAttribute(noticeXml, "timestamp")) ??
      toNumberOptional(readTextOptional(noticeXml, "TIMESTAMP")),
  }));

  return { notices };
};

export const parseNationPrivate = <TShards extends readonly NationPrivateShard[]>(
  xml: string,
  shards: TShards,
): ParsedByShards<NationPrivateShardMap, TShards> => {
  throwOnApiErrorTag("nation", xml);
  const result: Partial<NationPrivateShardMap> = {};

  for (const shard of shards) {
    ensureSupportedShard("nation", shard, SUPPORTED_PRIVATE_SHARDS, xml);

    switch (shard) {
      case "issues":
        result.issues = parseIssues(xml);
        break;
      case "issuesummary":
        result.issuesummary = parseIssueSummary(xml);
        break;
      case "nextissue":
        result.nextissue = readNumberRequired(xml, "NEXTISSUE", {
          resource: "nation",
          shard,
          xml,
        });
        break;
      case "nextissuetime":
        result.nextissuetime = readNumberRequired(xml, "NEXTISSUETIME", {
          resource: "nation",
          shard,
          xml,
        });
        break;
      case "notices":
        result.notices = parseNotices(xml);
        break;
      case "unread":
        result.unread = readNumberRequired(xml, "UNREAD", {
          resource: "nation",
          shard,
          xml,
        });
        break;
    }
  }

  return result as ParsedByShards<NationPrivateShardMap, TShards>;
};

export const parseNationPrivateResponse = <TShards extends readonly NationPrivateShard[]>(
  response: NSApiResponse,
  shards: TShards,
): ParsedByShards<NationPrivateShardMap, TShards> => {
  return parseNationPrivate(response.xml, shards);
};
