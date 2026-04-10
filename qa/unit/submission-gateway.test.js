import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getIsTestSubmissionFlag,
  resolveFormSubmissionEndpoint,
  submitUnifiedFormSubmission,
} from "../../scripts/site/submission-gateway.js";

describe("submission gateway", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("reads the browser submission endpoint from the injected global", () => {
    expect(
      resolveFormSubmissionEndpoint({
        __RaleighPremiumWellnessFormEndpoint: " https://example.com/forms-endpoint ",
      }),
    ).toBe("https://example.com/forms-endpoint");
  });

  it("marks preview and explicit test submissions as test rows", () => {
    expect(getIsTestSubmissionFlag("https://example.com/?testSubmission=1", {})).toBe(true);
    expect(getIsTestSubmissionFlag("https://example.com/", { releaseChannel: "preview" })).toBe(true);
    expect(getIsTestSubmissionFlag("https://example.com/", { releaseChannel: "production" })).toBe(false);
  });

  it("posts plain-text JSON to the configured endpoint and returns the response body", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, sheet_name: "work_with_us", row_number: 2 }),
    });

    const responseBody = await submitUnifiedFormSubmission(
      {
        interestPath: "work_with_us",
        normalizedValues: {
          first_name: "Roman",
        },
      },
      {
        globalScope: {
          __RaleighPremiumWellnessFormEndpoint: "https://example.com/forms-endpoint",
        },
        sourceUrl: "https://example.com/staging/?interestPath=work_with_us#contact",
        isTestSubmission: true,
      },
    );

    expect(fetchSpy).toHaveBeenCalledWith("https://example.com/forms-endpoint", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        path: "work_with_us",
        normalized_values: {
          first_name: "Roman",
        },
        source_url: "https://example.com/staging/?interestPath=work_with_us#contact",
        is_test_submission: true,
        google_sheet_target_url:
          "https://docs.google.com/spreadsheets/d/1rRNeWWqNsdbr1kuwpQfzuFWHaIAXx--MfyhgdhDyWV0/edit?usp=sharing",
      }),
      mode: "cors",
    });
    expect(responseBody.sheet_name).toBe("work_with_us");
  });

  it("raises a truthful error when the endpoint is missing or returns a failure", async () => {
    await expect(
      submitUnifiedFormSubmission(
        {
          interestPath: "partner_with_us",
          normalizedValues: {},
        },
        {
          globalScope: {},
        },
      ),
    ).rejects.toThrow("Form submission endpoint is not configured.");

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false, message: "Sheet write failed." }),
    });

    await expect(
      submitUnifiedFormSubmission(
        {
          interestPath: "partner_with_us",
          normalizedValues: {},
        },
        {
          globalScope: {
            __RaleighPremiumWellnessFormEndpoint: "https://example.com/forms-endpoint",
          },
        },
      ),
    ).rejects.toThrow("Sheet write failed.");
  });
});
