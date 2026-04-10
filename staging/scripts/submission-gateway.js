import { GOOGLE_SHEET_TARGET_URL } from "./form-configuration.js";

// Keep the browser-side gateway tiny so the form only needs to know where to
// send a valid submission, not how the sheet itself is structured.
const browserSubmissionEndpointKey = "__RaleighPremiumWellnessFormEndpoint";

export function resolveFormSubmissionEndpoint(globalScope = globalThis) {
  const configuredEndpoint = globalScope?.[browserSubmissionEndpointKey];

  if (typeof configuredEndpoint !== "string") {
    return "";
  }

  return configuredEndpoint.trim();
}

export function getIsTestSubmissionFlag(
  locationLike = globalThis.location,
  bodyDataset = globalThis.document?.body?.dataset,
) {
  const baseUrl = globalThis.location?.origin || "https://raleigh-premium-wellness.local";
  const currentUrl = locationLike instanceof URL ? locationLike : new URL(String(locationLike), baseUrl);
  const explicitTestFlag = currentUrl.searchParams.get("testSubmission");
  const releaseChannel = bodyDataset?.releaseChannel ?? "";

  return explicitTestFlag === "1" || releaseChannel === "preview";
}

export async function submitUnifiedFormSubmission(submissionPayload, options = {}) {
  const submissionEndpoint = resolveFormSubmissionEndpoint(options.globalScope ?? globalThis);

  if (!submissionEndpoint) {
    throw new Error("Form submission endpoint is not configured.");
  }

  const submissionBody = {
    path: submissionPayload.interestPath,
    normalized_values: submissionPayload.normalizedValues,
    source_url: options.sourceUrl ?? globalThis.location?.href ?? "",
    is_test_submission: Boolean(options.isTestSubmission),
    google_sheet_target_url: GOOGLE_SHEET_TARGET_URL,
  };

  // Use a simple text payload so the browser can call the Apps Script web app
  // without triggering a CORS preflight that the endpoint does not need.
  const response = await fetch(submissionEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(submissionBody),
    mode: "cors",
  });

  let responseBody = null;

  try {
    responseBody = await response.json();
  } catch {
    responseBody = null;
  }

  if (!response.ok || !responseBody?.ok) {
    const message =
      responseBody?.message ??
      "We’re sorry, your note could not be submitted right now. Please try again in a moment.";
    throw new Error(message);
  }

  return responseBody;
}
