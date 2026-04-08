export class NSParseError extends Error {
  readonly resource: "nation" | "region" | "world" | "wa";
  readonly shard?: string;
  readonly tag?: string;
  readonly xmlSnippet: string;

  constructor(options: {
    resource: "nation" | "region" | "world" | "wa";
    message: string;
    shard?: string;
    tag?: string;
    xml: string;
  }) {
    super(options.message);
    this.name = "NSParseError";
    this.resource = options.resource;
    this.shard = options.shard;
    this.tag = options.tag;
    this.xmlSnippet = options.xml.slice(0, 500);
  }
}
