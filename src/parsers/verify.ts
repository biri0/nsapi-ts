import type { NSApiResponse } from "../types";
import type { VerifyData } from "./types";
import { readTagText } from "./xml-helpers";

const trim = (value: string): string => value.trim();

export const parseVerify = (payload: string): VerifyData => {
  const verifyTag = readTagText(payload, "VERIFY");
  if (verifyTag !== undefined) {
    return {
      success: trim(verifyTag) === "1",
    };
  }

  return {
    success: trim(payload) === "1",
  };
};

export const parseVerifyResponse = (response: NSApiResponse): VerifyData => {
  return parseVerify(response.xml);
};
