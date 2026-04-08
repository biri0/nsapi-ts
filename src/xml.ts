const textDecoder = new TextDecoder();

export const parseXml = (xml: string): Document => {
  return new DOMParser().parseFromString(xml, "application/xml");
};

export const getFirstText = (xml: string, tagName: string): string | undefined => {
  const doc = parseXml(xml);
  const element = doc.querySelector(tagName.toUpperCase()) ?? doc.querySelector(tagName);
  return element?.textContent?.trim() || undefined;
};

export const xmlToUtf8 = async (input: Response): Promise<string> => {
  const buffer = await input.arrayBuffer();
  return textDecoder.decode(buffer);
};
