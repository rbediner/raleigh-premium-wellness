/**
 * Purpose: Verify that a deployed or locally served site artifact is serving
 * the expected release-channel behavior.
 * Role: Used for preview smoke checks, production smoke checks, and post-deploy
 * verification evidence.
 * Dependencies: Node.js 22+ for the project runtime and native fetch.
 * Risk: Low. This script only reads remote or local HTTP responses.
 */

const commandLineArguments = process.argv.slice(2);

function readArgument(flagName) {
  const argumentIndex = commandLineArguments.indexOf(flagName);
  return argumentIndex >= 0 ? commandLineArguments[argumentIndex + 1] : undefined;
}

const siteUrl = readArgument("--url");
const mode = readArgument("--mode");
const expectedSha = readArgument("--sha");
const ciRunUrl = readArgument("--ci-run-url");
const deployUrl = readArgument("--deploy-url");

if (!siteUrl || !["preview", "production"].includes(mode)) {
  throw new Error("Pass --url <site-url> and --mode preview|production.");
}

const response = await fetch(siteUrl, {
  headers: {
    "Cache-Control": "no-cache",
  },
});

if (!response.ok) {
  throw new Error(`Smoke check failed because ${siteUrl} returned ${response.status}.`);
}

const responseText = await response.text();
const pageText = responseText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

if (!pageText.includes("A NEW STANDARD IN PREMIUM WELLNESS IS COMING TO RALEIGH")) {
  throw new Error("Smoke check failed because the locked hero headline was not found.");
}

if (!responseText.includes(`data-release-channel="${mode}"`)) {
  throw new Error(`Smoke check failed because the page is not marked as ${mode}.`);
}

if (mode === "preview") {
  if (!responseText.includes('name="robots" content="noindex, noarchive, nofollow"')) {
    throw new Error("Preview smoke check failed because the preview artifact is not noindex/noarchive.");
  }

  if (responseText.includes('rel="canonical"')) {
    throw new Error("Preview smoke check failed because a canonical tag leaked into preview.");
  }
} else {
  if (responseText.includes('name="robots" content="noindex, noarchive, nofollow"')) {
    throw new Error("Production smoke check failed because production is marked noindex.");
  }
}

console.log(`Smoke check passed for ${mode}: ${siteUrl}`);

if (expectedSha || ciRunUrl || deployUrl) {
  console.log(
    JSON.stringify(
      {
        mode,
        siteUrl,
        expectedSha: expectedSha || null,
        ciRunUrl: ciRunUrl || null,
        deployUrl: deployUrl || null,
        smokeResult: "passed",
      },
      null,
      2,
    ),
  );
}
