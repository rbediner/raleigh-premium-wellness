import { describe, expect, it } from "vitest";

import { consumeQrAttribution } from "../../scripts/site/qr-attribution.js";

describe("QR attribution", () => {
  it("returns an approved QR source and removes only the QR parameter", () => {
    expect(
      consumeQrAttribution(
        "https://example.com/?qr=business-card&interestPath=partner_with_us#contact",
      ),
    ).toEqual({
      cleanedUrl: "https://example.com/?interestPath=partner_with_us#contact",
      qrSource: "business-card",
    });
  });

  it("does not emit invalid QR labels but still cleans them from shared URLs", () => {
    expect(consumeQrAttribution("https://example.com/?qr=Business%20Card")).toEqual({
      cleanedUrl: "https://example.com/",
      qrSource: null,
    });
  });

  it("leaves ordinary URLs untouched", () => {
    expect(consumeQrAttribution("https://example.com/#about")).toEqual({
      cleanedUrl: "https://example.com/#about",
      qrSource: null,
    });
  });
});
