import { describe, expect, test } from "bun:test";
import { NSApiClient, NSAuthError, NationStates } from "../src";

const xmlOk = "<NATION><NAME>Testlandia</NAME></NATION>";

describe("NSApiClient", () => {
  test("builds nation request with normalized name and shards", async () => {
    const seen: URL[] = [];

    const client = new NSApiClient({
      userAgent: "nsapi-ts-test/0.1 (https://github.com/Biri0/nsapi-ts)",
      apiVersion: 12,
      fetchImpl: async (input) => {
        seen.push(new URL(String(input)));
        return new Response(xmlOk, { status: 200 });
      },
    });

    const result = await client.nation("The Grendels", ["name", "region", "wa"]);
    const url = seen[0];
    expect(url).toBeDefined();
    if (!url) {
      throw new Error("Expected request URL to be captured");
    }

    expect(url.searchParams.get("nation")).toBe("the_grendels");
    expect(url.searchParams.get("q")).toBe("name+region+wa");
    expect(url.searchParams.get("v")).toBe("12");
    expect(result.status).toBe(200);
    expect(result.xml).toContain("<NAME>Testlandia</NAME>");
  });

  test("retries after 429 using Retry-After", async () => {
    let calls = 0;

    const client = new NSApiClient({
      userAgent: "nsapi-ts-test/0.1 (https://github.com/Biri0/nsapi-ts)",
      maxRetries: 1,
      fetchImpl: async () => {
        calls += 1;
        if (calls === 1) {
          return new Response("rate limited", {
            status: 429,
            headers: {
              "Retry-After": "0",
            },
          });
        }

        return new Response(xmlOk, {
          status: 200,
          headers: {
            "RateLimit-Limit": "50",
            "RateLimit-Remaining": "49",
          },
        });
      },
    });

    const result = await client.world(["numnations"]);

    expect(calls).toBe(2);
    expect(result.rateLimit.limit).toBe(50);
    expect(result.rateLimit.remaining).toBe(49);
  });

  test("captures auth headers from private requests", async () => {
    const client = new NSApiClient({
      userAgent: "nsapi-ts-test/0.1 (https://github.com/Biri0/nsapi-ts)",
      auth: { password: "hunter2" },
      fetchImpl: async (_input, init) => {
        const headers = new Headers(init?.headers);
        expect(headers.get("X-Password")).toBe("hunter2");

        return new Response("<NATION><UNREAD>4</UNREAD></NATION>", {
          status: 200,
          headers: {
            "X-Pin": "1234567890",
            "X-Autologin": "AUTOLOGIN_CODE",
          },
        });
      },
    });

    const response = await client.nationPrivate("Testlandia", ["unread"]);
    expect(response.auth.pin).toBe("1234567890");
    expect(response.auth.autologin).toBe("AUTOLOGIN_CODE");
  });

  test("rejects private requests without auth", async () => {
    const client = new NSApiClient({
      userAgent: "nsapi-ts-test/0.1 (https://github.com/Biri0/nsapi-ts)",
      fetchImpl: async () => new Response("ok"),
    });

    await expect(client.nationPrivate("Testlandia", ["unread"])).rejects.toThrow(NSAuthError);
  });

  test("verify API builds request", async () => {
    const seen: URL[] = [];
    const client = new NSApiClient({
      userAgent: "nsapi-ts-test/0.1 (https://github.com/Biri0/nsapi-ts)",
      fetchImpl: async (input) => {
        seen.push(new URL(String(input)));
        return new Response("1", { status: 200 });
      },
    });

    await client.verify("Testlandia", "abcdef", "tok123", ["name", "population"]);
    const url = seen[0];
    expect(url).toBeDefined();
    if (!url) {
      throw new Error("Expected verify URL to be captured");
    }

    expect(url.searchParams.get("a")).toBe("verify");
    expect(url.searchParams.get("nation")).toBe("testlandia");
    expect(url.searchParams.get("checksum")).toBe("abcdef");
    expect(url.searchParams.get("token")).toBe("tok123");
    expect(url.searchParams.get("q")).toBe("name+population");
  });
});

describe("NationStates facade", () => {
  test("proxies resource calls", async () => {
    const api = new NationStates({
      userAgent: "nsapi-ts-test/0.1 (https://github.com/Biri0/nsapi-ts)",
      fetchImpl: async () => new Response("<REGION><NAME>the_north_pacific</NAME></REGION>"),
    });

    const response = await api.region.get({
      region: "The North Pacific",
      shards: ["name", "numnations"],
    });

    expect(response.xml).toContain("<REGION>");
  });
});
