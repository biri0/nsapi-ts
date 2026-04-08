import { NSParseError } from "./errors";

export type ResourceKind = "nation" | "region" | "world" | "wa";

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const readTagText = (xml: string, tag: string): string | undefined => {
  const tagPattern = escapeRegExp(tag);
  const match = xml.match(new RegExp(`<${tagPattern}\\b[^>]*>([\\s\\S]*?)</${tagPattern}>`, "i"));
  return match?.[1]?.trim() || undefined;
};

export const readTagBlock = (xml: string, tag: string): string | undefined => {
  const tagPattern = escapeRegExp(tag);
  const match = xml.match(new RegExp(`<${tagPattern}\\b[^>]*>[\\s\\S]*?</${tagPattern}>`, "i"));
  return match?.[0];
};

export const readTagAttribute = (
  xml: string,
  tag: string,
  attribute: string,
): string | undefined => {
  const tagPattern = escapeRegExp(tag);
  const attrPattern = escapeRegExp(attribute);
  const match = xml.match(
    new RegExp(`<${tagPattern}\\b[^>]*\\b${attrPattern}=["']([^"']+)["'][^>]*>`, "i"),
  );
  return match?.[1];
};

export const splitList = (value: string | undefined, delimiter = ","): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(delimiter)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

export const readTextOptional = (xml: string, tag: string): string | undefined => {
  return readTagText(xml, tag);
};

export const readTextRequired = (
  xml: string,
  tag: string,
  context: {
    resource: ResourceKind;
    shard: string;
    xml: string;
  },
): string => {
  const value = readTagText(xml, tag);
  if (!value) {
    throw new NSParseError({
      resource: context.resource,
      shard: context.shard,
      tag,
      message: `Missing required tag <${tag}> for shard '${context.shard}'`,
      xml: context.xml,
    });
  }

  return value;
};

export const readNumberRequired = (
  xml: string,
  tag: string,
  context: {
    resource: ResourceKind;
    shard: string;
    xml: string;
  },
): number => {
  const value = readTextRequired(xml, tag, context);
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    throw new NSParseError({
      resource: context.resource,
      shard: context.shard,
      tag,
      message: `Tag <${tag}> for shard '${context.shard}' is not numeric`,
      xml: context.xml,
    });
  }

  return numeric;
};

export const ensureSupportedShard = <T extends string>(
  resource: ResourceKind,
  shard: string,
  supported: ReadonlySet<T>,
  xml: string,
): void => {
  if (!supported.has(shard as T)) {
    throw new NSParseError({
      resource,
      shard,
      message: `Unsupported shard parser for '${shard}' on ${resource}`,
      xml,
    });
  }
};

export const throwOnApiErrorTag = (resource: ResourceKind, xml: string): void => {
  const errorText = readTagText(xml, "ERROR");

  if (errorText) {
    throw new NSParseError({
      resource,
      message: `NationStates API returned ERROR: ${errorText}`,
      tag: "ERROR",
      xml,
    });
  }
};
