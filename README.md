# nsapi-ts

TypeScript wrapper for the NationStates API with public read-only support plus initial private/auth support.

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

const unread = await ns.nation.getPrivate({
  nation: "Testlandia",
  shards: ["unread"],
});

console.log(unread.auth.pin);
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
- `ns.nation.getPrivate({ nation, shards, params?, auth? })`
- `ns.nation.issue({ nation, issue, option, params?, auth? })`
- `ns.region.get({ region, shards?, params? })`
- `ns.world.get({ shards?, params? })`
- `ns.wa.get({ councilId, shards?, id?, params? })`
- `ns.verify.check({ nation, checksum, token?, shards?, params? })`

All methods return:

- raw XML response text
- response headers
- parsed rate-limit headers (`RateLimit-*`, `Retry-After`)
- captured auth/session headers (`X-Pin`, `X-Autologin`)

## Notes

- `userAgent` is required by NationStates API terms.
- Provide auth in constructor for private features: `auth: { pin? | autologin? | password? }`.
- Initial private support includes nation shards: `issues`, `issuesummary`, `nextissue`, `nextissuetime`, `notices`, `unread`.
- Initial private command support includes `c=issue`.
- Verification API is supported via `a=verify`.
- Nation/region names are normalized to lowercase with underscores.
- Parsers are shard-specific; requesting an unsupported parser shard throws `NSParseError`.
- Current parser coverage includes basic shards, `census`, `happenings`, `dispatchlist` (nation/world), and WA vote-detail shards (`voters`, `votetrack`, `dellog`, `delvotes`).

## Private/Auth example

```ts
import { NationStates, parseNationPrivateResponse, parseIssueCommandResponse } from "./src";

const ns = new NationStates({
  userAgent: "my-app/0.1 (you@example.com)",
  auth: { password: process.env.NS_PASSWORD },
});

const privateResponse = await ns.nation.getPrivate({
  nation: "Testlandia",
  shards: ["issues", "unread"],
});

const parsedPrivate = parseNationPrivateResponse(privateResponse, ["issues", "unread"] as const);

const issueResult = await ns.nation.issue({
  nation: "Testlandia",
  issue: 111,
  option: 2,
});

const parsedIssueResult = parseIssueCommandResponse(issueResult);
console.log(parsedPrivate.unread, parsedIssueResult.ok);
```

## Test

```bash
bun test
```
