import { describe, expect, test } from "bun:test";
import {
  NSParseError,
  parseNation,
  parseRegion,
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
});
