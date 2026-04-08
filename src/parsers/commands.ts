import type { NSApiResponse } from "../types";
import type { IssueCommandResult } from "./types";
import {
  readAnyTagAttribute,
  readTagBlock,
  readTagBlocks,
  readTextOptional,
  readTagText,
  splitList,
  throwOnApiErrorTag,
  toNumberOptional,
} from "./xml-helpers";

const parseRankingEntry = (xml: string) => ({
  id: toNumberOptional(readAnyTagAttribute(xml, "id") ?? readTextOptional(xml, "ID")),
  score: toNumberOptional(readAnyTagAttribute(xml, "score") ?? readTextOptional(xml, "SCORE")),
  change: toNumberOptional(readAnyTagAttribute(xml, "change") ?? readTextOptional(xml, "CHANGE")),
  pchange: toNumberOptional(readAnyTagAttribute(xml, "pchange") ?? readTextOptional(xml, "PCHANGE")),
  rank: toNumberOptional(readAnyTagAttribute(xml, "rank") ?? readTextOptional(xml, "RANK")),
});

const parseStringListFromBlock = (xml: string, blockTag: string, entryTag: string): string[] => {
  const block = readTagBlock(xml, blockTag);
  if (!block) {
    return [];
  }

  const entries = readTagBlocks(block, entryTag)
    .map((entryXml) => readTagText(entryXml, entryTag)?.trim())
    .filter((value): value is string => Boolean(value));

  if (entries.length > 0) {
    return entries;
  }

  return splitList(readTextOptional(block, blockTag), ",");
};

export const parseIssueCommand = (xml: string): IssueCommandResult => {
  throwOnApiErrorTag("nation", xml);

  const rankingsBlock = readTagBlock(xml, "RANKINGS");
  const rankings = rankingsBlock ? readTagBlocks(rankingsBlock, "RANK").map(parseRankingEntry) : [];

  return {
    ok: readTagText(xml, "OK") === "1" || Boolean(readTagText(xml, "OK")),
    desc: readTextOptional(xml, "DESC"),
    rankings,
    unlocks: parseStringListFromBlock(xml, "UNLOCKS", "UNLOCK"),
    reclassifications: parseStringListFromBlock(xml, "RECLASSIFICATIONS", "RECLASSIFICATION"),
    newPolicies: parseStringListFromBlock(xml, "NEW_POLICIES", "POLICY"),
    removedPolicies: parseStringListFromBlock(xml, "REMOVED_POLICIES", "POLICY"),
  };
};

export const parseIssueCommandResponse = (response: NSApiResponse): IssueCommandResult => {
  return parseIssueCommand(response.xml);
};
