# nsapi-ts

TypeScript wrapper for the NationStates public read-only API.

## Install

```bash
bun install
```

## Usage

```ts
import { NationStates } from "./src";

const ns = new NationStates({
  userAgent: "my-app/0.1 (you@example.com)",
  apiVersion: 12,
});

const nation = await ns.nation.get({
  nation: "Testlandia",
  shards: ["name", "region", "population"],
});

console.log(nation.xml);

const world = await ns.world.get({ shards: ["numnations"] });
console.log(world.rateLimit.remaining);
```

You can parse supported shards into typed data:

```ts
import { parseNationResponse } from "./src";

const response = await ns.nation.get({
  nation: "Testlandia",
  shards: ["name", "population", "endorsements"],
});

const nation = parseNationResponse(response, ["name", "population", "endorsements"] as const);
console.log(nation.population);
```

## Exposed resources

- `ns.nation.get({ nation, shards?, params? })`
- `ns.region.get({ region, shards?, params? })`
- `ns.world.get({ shards?, params? })`
- `ns.wa.get({ councilId, shards?, id?, params? })`

All methods return:

- raw XML response text
- response headers
- parsed rate-limit headers (`RateLimit-*`, `Retry-After`)

## Notes

- `userAgent` is required by NationStates API terms.
- This wrapper currently targets read-only public endpoints.
- Nation/region names are normalized to lowercase with underscores.
- Parsers are shard-specific; requesting an unsupported parser shard throws `NSParseError`.
- Current parser coverage includes basic shards, `census`, `happenings`, `dispatchlist` (nation/world), and WA vote-detail shards (`voters`, `votetrack`, `dellog`, `delvotes`).

## Test

```bash
bun test
```
