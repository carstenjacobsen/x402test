import { ASSET_METADATA } from './chunk-DEFBSM2Q.js';

// src/utils.ts
function toBaseUnits(amount, asset) {
  const decimals = ASSET_METADATA[asset].decimals;
  const factor = BigInt(10 ** decimals);
  const [intPart, fracPart = ""] = amount.split(".");
  const paddedFrac = fracPart.padEnd(decimals, "0").slice(0, decimals);
  const baseUnits = BigInt(intPart) * factor + BigInt(paddedFrac || "0");
  return baseUnits.toString();
}
function fromBaseUnits(baseUnits, asset) {
  const decimals = ASSET_METADATA[asset].decimals;
  const factor = BigInt(10 ** decimals);
  const value = BigInt(baseUnits);
  const intPart = value / factor;
  const fracPart = (value % factor).toString().padStart(decimals, "0");
  return `${intPart}.${fracPart}`;
}
function baseUnitsToXlmString(stroops) {
  return fromBaseUnits(stroops, "XLM");
}
function encodeHeader(obj) {
  const json = JSON.stringify(obj);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(json).toString("base64");
  }
  return btoa(json);
}
function decodeHeader(encoded) {
  let json;
  if (typeof Buffer !== "undefined") {
    json = Buffer.from(encoded, "base64").toString("utf-8");
  } else {
    json = atob(encoded);
  }
  return JSON.parse(json);
}
function safeDecodeHeader(encoded) {
  try {
    return decodeHeader(encoded);
  } catch {
    return null;
  }
}

export { baseUnitsToXlmString, decodeHeader, encodeHeader, fromBaseUnits, safeDecodeHeader, toBaseUnits };
//# sourceMappingURL=chunk-WFMBZF52.js.map
//# sourceMappingURL=chunk-WFMBZF52.js.map