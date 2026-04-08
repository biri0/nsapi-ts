import { describe, expect, test } from "bun:test";
import {
  NSParseError,
  parseIssueCommand,
  parseNation,
  parseNationPrivate,
  parseRegion,
  parseVerify,
  parseWA,
  parseWorld,
} from "../src";

describe("XML parsers", () => {
  test("parses nation shards", () => {
    const xml = [
      "<NATION>",
      "<NAME>Testlandia</NAME>",
      "<REGION>The Rejected Realms</REGION>",
      "<POPULATION>12345</POPULATION>",
      "<UNSTATUS>WA Member</UNSTATUS>",
      "<MOTTO>For Science</MOTTO>",
      "<CATEGORY>Inoffensive Centrist Democracy</CATEGORY>",
      "<ENDORSEMENTS>a,b,c</ENDORSEMENTS>",
      "</NATION>",
    ].join("");

    const data = parseNation(xml, ["name", "population", "endorsements"] as const);
    expect(data.name).toBe("Testlandia");
    expect(data.population).toBe(12345);
    expect(data.endorsements).toEqual(["a", "b", "c"]);
  });

  test("parses nation census and happenings shards", () => {
    const xml = [
      "<NATION>",
      "<CENSUS>",
      '<SCALE id="66">',
      "<SCORE>12.3</SCORE>",
      "<RANK>15</RANK>",
      "<RRANK>2</RRANK>",
      "<PRANK>1.5</PRANK>",
      "<PRRANK>0.2</PRRANK>",
      "<HISTORY>",
      '<POINT timestamp="1700000000" score="11.1"></POINT>',
      '<POINT timestamp="1700000300" score="12.3"></POINT>',
      "</HISTORY>",
      "</SCALE>",
      "</CENSUS>",
      "<HAPPENINGS>",
      '<EVENT id="100" timestamp="1700000500">',
      "<TEXT>Test event 1</TEXT>",
      "</EVENT>",
      "<EVENT>",
      "<TIMESTAMP>1700000600</TIMESTAMP>",
      "<STR>Test event 2</STR>",
      "<TYPE>change</TYPE>",
      "</EVENT>",
      "</HAPPENINGS>",
      "</NATION>",
    ].join("");

    const data = parseNation(xml, ["census", "happenings"] as const);

    expect(data.census.scales.length).toBe(1);
    expect(data.census.scales[0]?.id).toBe(66);
    expect(data.census.scales[0]?.history.length).toBe(2);
    expect(data.happenings.events.length).toBe(2);
    expect(data.happenings.events[0]?.id).toBe(100);
    expect(data.happenings.events[1]?.type).toBe("change");
  });

  test("parses nation dispatchlist shard", () => {
    const xml = [
      "<NATION>",
      "<DISPATCHLIST>",
      '<DISPATCH id="12" title="One" author="testlandia" category="Factbook" subcategory="History" created="1700000000" edited="1700000100" score="5" views="200"></DISPATCH>',
      "<DISPATCH>",
      "<ID>13</ID>",
      "<TITLE>Two</TITLE>",
      "<AUTHOR>testlandia</AUTHOR>",
      "</DISPATCH>",
      "</DISPATCHLIST>",
      "</NATION>",
    ].join("");

    const data = parseNation(xml, ["dispatchlist"] as const);
    expect(data.dispatchlist.dispatches.length).toBe(2);
    expect(data.dispatchlist.dispatches[0]?.id).toBe(12);
    expect(data.dispatchlist.dispatches[0]?.views).toBe(200);
    expect(data.dispatchlist.dispatches[1]?.title).toBe("Two");
  });

  test("parses region shards", () => {
    const xml = [
      "<REGION>",
      "<NAME>the_rejected_realms</NAME>",
      "<NUMNATIONS>99</NUMNATIONS>",
      "<NATIONS>a:b:c</NATIONS>",
      "<UNNATIONS>a,b</UNNATIONS>",
      "<POWER>High</POWER>",
      "</REGION>",
    ].join("");

    const data = parseRegion(xml, ["name", "numnations", "nations", "wanations"] as const);
    expect(data.name).toBe("the_rejected_realms");
    expect(data.numnations).toBe(99);
    expect(data.nations).toEqual(["a", "b", "c"]);
    expect(data.wanations).toEqual(["a", "b"]);
  });

  test("parses world shards", () => {
    const xml =
      "<WORLD><NUMNATIONS>1000</NUMNATIONS><NUMREGIONS>100</NUMREGIONS><NEWNATIONS>n1,n2</NEWNATIONS><LASTEVENTID>400</LASTEVENTID></WORLD>";

    const data = parseWorld(xml, ["numnations", "newnations", "lasteventid"] as const);
    expect(data.numnations).toBe(1000);
    expect(data.newnations).toEqual(["n1", "n2"]);
    expect(data.lasteventid).toBe(400);
  });

  test("parses world census and happenings shards", () => {
    const xml = [
      "<WORLD>",
      "<CENSUS>",
      '<SCALE id="77">',
      "<SCORE>88.8</SCORE>",
      "<RANK>9</RANK>",
      "</SCALE>",
      "</CENSUS>",
      "<HAPPENINGS>",
      '<EVENT id="101" timestamp="1700000700">',
      "<TEXT>World event</TEXT>",
      "<TYPE>founding</TYPE>",
      "</EVENT>",
      "</HAPPENINGS>",
      "</WORLD>",
    ].join("");

    const data = parseWorld(xml, ["census", "happenings"] as const);
    expect(data.census.scales[0]?.id).toBe(77);
    expect(data.census.scales[0]?.score).toBe(88.8);
    expect(data.happenings.events[0]?.type).toBe("founding");
  });

  test("parses world dispatchlist shard", () => {
    const xml = [
      "<WORLD>",
      "<DISPATCHLIST>",
      '<DISPATCH id="99" title="World Post" author="author_nation"></DISPATCH>',
      "</DISPATCHLIST>",
      "</WORLD>",
    ].join("");

    const data = parseWorld(xml, ["dispatchlist"] as const);
    expect(data.dispatchlist.dispatches.length).toBe(1);
    expect(data.dispatchlist.dispatches[0]?.id).toBe(99);
    expect(data.dispatchlist.dispatches[0]?.author).toBe("author_nation");
  });

  test("parses wa shards", () => {
    const xml = [
      "<WA>",
      "<NUMNATIONS>200</NUMNATIONS>",
      "<DELEGATES>a,b</DELEGATES>",
      "<RESOLUTION id=\"22\">",
      "<NAME>Test Resolution</NAME>",
      "<CATEGORY>Commendation</CATEGORY>",
      "<DESC>desc</DESC>",
      "<PROPOSED_BY>testlandia</PROPOSED_BY>",
      "</RESOLUTION>",
      "</WA>",
    ].join("");

    const data = parseWA(xml, ["numnations", "delegates", "resolution"] as const);
    expect(data.numnations).toBe(200);
    expect(data.delegates).toEqual(["a", "b"]);
    expect(data.resolution.id).toBe(22);
    expect(data.resolution.name).toBe("Test Resolution");
  });

  test("parses wa vote-detail shards", () => {
    const xml = [
      "<WA>",
      "<VOTERS>a,b,c</VOTERS>",
      "<VOTETRACK>",
      '<ENTRY nation="a" vote="for" timestamp="1700000001"></ENTRY>',
      '<ENTRY nation="b" vote="against" timestamp="1700000002"></ENTRY>',
      "</VOTETRACK>",
      "<DELLOG>",
      '<DELEGATE nation="delegate_one" vote="for"></DELEGATE>',
      "</DELLOG>",
      "<DELVOTES>",
      "<VOTE>",
      "<NATION>delegate_two</NATION>",
      "<VOTE>against</VOTE>",
      "</VOTE>",
      "</DELVOTES>",
      "</WA>",
    ].join("");

    const data = parseWA(xml, ["voters", "votetrack", "dellog", "delvotes"] as const);
    expect(data.voters).toEqual(["a", "b", "c"]);
    expect(data.votetrack.length).toBe(2);
    expect(data.votetrack[0]?.nation).toBe("a");
    expect(data.dellog[0]?.delegate).toBe("delegate_one");
    expect(data.delvotes[0]?.vote).toBe("against");
  });

  test("throws for unsupported shard", () => {
    const xml = "<NATION><NAME>Testlandia</NAME></NATION>";

    expect(() => {
      parseNation(xml, ["name", "govt" as never] as const);
    }).toThrow(NSParseError);
  });

  test("throws for api error payload", () => {
    const xml = "<NATION><ERROR>Rate limited</ERROR></NATION>";

    expect(() => {
      parseNation(xml, ["name"] as const);
    }).toThrow(NSParseError);
  });

  test("parses private nation shards", () => {
    const xml = [
      "<NATION>",
      "<UNREAD>7</UNREAD>",
      "<NEXTISSUE>111</NEXTISSUE>",
      "<NEXTISSUETIME>1700005000</NEXTISSUETIME>",
      "<ISSUES>",
      '<ISSUE id="111">',
      "<TITLE>A Testing Issue</TITLE>",
      "<TEXT>Choose wisely</TEXT>",
      '<OPTION id="0"><TEXT>Option A</TEXT></OPTION>',
      '<OPTION id="1"><TEXT>Option B</TEXT></OPTION>',
      "</ISSUE>",
      "</ISSUES>",
      "<ISSUESUMMARY>",
      '<ISSUE id="111" optioncount="2"><TITLE>A Testing Issue</TITLE></ISSUE>',
      "</ISSUESUMMARY>",
      "<NOTICES>",
      '<NOTICE id="900" timestamp="1700005010"><TEXT>Welcome</TEXT></NOTICE>',
      "</NOTICES>",
      "</NATION>",
    ].join("");

    const data = parseNationPrivate(
      xml,
      ["unread", "nextissue", "nextissuetime", "issues", "issuesummary", "notices"] as const,
    );

    expect(data.unread).toBe(7);
    expect(data.nextissue).toBe(111);
    expect(data.nextissuetime).toBe(1700005000);
    expect(data.issues.issues[0]?.id).toBe(111);
    expect(data.issues.issues[0]?.options.length).toBe(2);
    expect(data.issuesummary.issues[0]?.optionCount).toBe(2);
    expect(data.notices.notices[0]?.id).toBe(900);
  });

  test("parses issue command result", () => {
    const xml = [
      "<NATION>",
      "<OK>1</OK>",
      "<DESC>Legislation enacted.</DESC>",
      "<RANKINGS>",
      '<RANK id="66" score="12.1" change="1.2" pchange="5.0" rank="100"></RANK>',
      "</RANKINGS>",
      "<UNLOCKS><UNLOCK>Policy A</UNLOCK></UNLOCKS>",
      "<NEW_POLICIES><POLICY>Policy B</POLICY></NEW_POLICIES>",
      "</NATION>",
    ].join("");

    const parsed = parseIssueCommand(xml);
    expect(parsed.ok).toBe(true);
    expect(parsed.desc).toContain("enacted");
    expect(parsed.rankings[0]?.id).toBe(66);
    expect(parsed.unlocks).toEqual(["Policy A"]);
    expect(parsed.newPolicies).toEqual(["Policy B"]);
  });

  test("parses verification responses", () => {
    expect(parseVerify("1").success).toBe(true);
    expect(parseVerify("0").success).toBe(false);
    expect(parseVerify("<NATION><VERIFY>1</VERIFY><NAME>Testlandia</NAME></NATION>").success).toBe(true);
  });
});
