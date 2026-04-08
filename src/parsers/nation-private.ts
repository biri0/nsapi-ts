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
  const issuesBlock = readTagBlocks(xml, "ISSUES").find((block) => readTagBlocks(block, "ISSUE").length > 0);
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
  const noticesBlock =
    readTagBlocks(xml, "NOTICES").find((block) => readTagBlocks(block, "NOTICE").length > 0) ??
    readTagBlock(xml, "NOTICES");
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

const parseUnread = (
  xml: string,
  context: {
    resource: "nation";
    shard: "unread";
    xml: string;
  },
) => {
  const unreadBlock = readTagBlock(xml, "UNREAD");
  if (!unreadBlock) {
    const fallbackTotal = readNumberRequired(xml, "UNREAD", context);
    return {
      total: fallbackTotal,
      counts: {},
      rmb: [],
    };
  }

  const unreadInner = readTextOptional(unreadBlock, "UNREAD") ?? "";
  const childTagRegex = /<([A-Za-z0-9_:-]+)\b([^>]*)>([\s\S]*?)<\/\1>/g;
  const counts: Record<string, number> = {};
  const rmb: Array<{ region?: string; count: number }> = [];

  for (const match of unreadInner.matchAll(childTagRegex)) {
    const tag = (match[1] ?? "").toLowerCase();
    const block = match[0] ?? "";
    const value = toNumberOptional((match[3] ?? "").trim());

    if (value === undefined) {
      continue;
    }

    if (tag === "rmb") {
      rmb.push({
        region: readTagAttribute(block, "RMB", "region"),
        count: value,
      });
      continue;
    }

    counts[tag] = (counts[tag] ?? 0) + value;
  }

  if (Object.keys(counts).length === 0 && rmb.length === 0) {
    const fallbackTotal = readNumberRequired(xml, "UNREAD", context);
    return {
      total: fallbackTotal,
      counts: {},
      rmb: [],
    };
  }

  const total =
    Object.values(counts).reduce((sum, value) => sum + value, 0) +
    rmb.reduce((sum, entry) => sum + entry.count, 0);

  return {
    total,
    counts,
    issues: counts.issues,
    telegrams: counts.telegrams,
    notices: counts.notices,
    wa: counts.wa,
    news: counts.news,
    rmb,
  };
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
        result.unread = parseUnread(xml, {
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
