/**
 * Purpose: Build a release artifact for either the staging preview channel or
 * the production channel.
 * Role: Creates static files in dist/preview or dist/production with the
 * correct SEO and environment safety rules for that channel.
 * Dependencies: Node.js only.
 * Risk: This script controls canonical/noindex behavior, so changes should be
 * reviewed carefully and protected by tests.
 */

import { copyFileSync, cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, resolve } from "node:path";
import { productionCanonicalUrl } from "./production-domain-config.mjs";

const commandLineArguments = process.argv.slice(2);
const modeIndex = commandLineArguments.indexOf("--mode");
const buildMode = modeIndex >= 0 ? commandLineArguments[modeIndex + 1] : undefined;

if (!["preview", "production"].includes(buildMode)) {
  throw new Error("Pass --mode preview or --mode production.");
}

const repositoryRoot = process.cwd();
const outputDirectory = resolve(repositoryRoot, "dist", buildMode);
const outputStylesDirectory = join(outputDirectory, "styles");
const outputScriptsDirectory = join(outputDirectory, "scripts");
const outputAssetsDirectory = join(outputDirectory, "assets");

const sourceHtml = readFileSync(resolve(repositoryRoot, "site", "index.html"), "utf8");
const sourceStylesPath = resolve(repositoryRoot, "styles", "site.css");
const sourceInteractionScriptPath = resolve(
  repositoryRoot,
  "scripts",
  "site",
  "site-interactions.js",
);
const sourceFormConfigPath = resolve(
  repositoryRoot,
  "scripts",
  "site",
  "form-configuration.js",
);
const sourceSubmissionGatewayPath = resolve(
  repositoryRoot,
  "scripts",
  "site",
  "submission-gateway.js",
);
const sourceQrAttributionPath = resolve(
  repositoryRoot,
  "scripts",
  "site",
  "qr-attribution.js",
);
const sourceAssetsDirectory = resolve(repositoryRoot, "assets");

const currentCommitSha = process.env.GITHUB_SHA || execSync("git rev-parse HEAD").toString().trim();
const formSubmissionEndpointUrl = process.env.FORM_SUBMISSION_ENDPOINT_URL?.trim() || "";
// Keep this in source control so every production build uses the real public address.
const canonicalUrl = productionCanonicalUrl;
const repositorySlug =
  process.env.GITHUB_REPOSITORY ||
  execSync("git config --get remote.origin.url").toString().trim().match(/[:/]([^/]+\/[^/.]+)(?:\.git)?$/)?.[1] ||
  "";
const [repositoryOwner = "rbediner", repositoryName = "raleigh-premium-wellness"] = repositorySlug.split("/");
const githubPagesBaseUrl = `https://${repositoryOwner}.github.io/${repositoryName}`;
const releaseSiteUrl =
  buildMode === "preview"
    ? `${githubPagesBaseUrl}/staging/`
    : canonicalUrl
      ? `${canonicalUrl}/`
      : `${githubPagesBaseUrl}/`;
const openGraphImageUrl = `${releaseSiteUrl}assets/share-surfaces/open-graph-preview-1200x630.png`;

const endpointScript = formSubmissionEndpointUrl
  ? `\n    <script>window.__RaleighPremiumWellnessFormEndpoint = ${JSON.stringify(formSubmissionEndpointUrl)};</script>`
  : "";

const previewHeadMarkup = `
    <meta name="robots" content="noindex, noarchive, nofollow" />
    <meta name="googlebot" content="noindex, noarchive, nofollow" />
    <meta property="og:url" content="${releaseSiteUrl}" />
    <meta name="release-channel" content="preview" />${endpointScript}`;

const productionHeadMarkup = canonicalUrl
  ? `
    <link rel="canonical" href="${canonicalUrl}/" />
    <meta property="og:url" content="${releaseSiteUrl}" />
    <meta name="release-channel" content="production" />${endpointScript}`
  : `
    <meta property="og:url" content="${releaseSiteUrl}" />
    <meta name="release-channel" content="production" />${endpointScript}`;

const previewBannerMarkup = `
    <div class="environment-banner" role="status">
      Staging preview build. Review here first. Do not treat this as the live site.
    </div>`;

function buildHtmlForMode() {
  const environmentHeadMarkup = buildMode === "preview" ? previewHeadMarkup : productionHeadMarkup;
  const environmentBannerMarkup = buildMode === "preview" ? previewBannerMarkup : "";
  // GitHub Pages can cache static files after a deploy, so couple both the
  // stylesheet and entry module URLs to this exact release commit. This keeps
  // new markup from ever rendering with an older stylesheet in a phone cache.
  const versionedStylesheetUrl = `./styles/site.css?v=${currentCommitSha}`;
  const versionedInteractionScriptUrl = `./scripts/site-interactions.js?v=${currentCommitSha}`;

  return sourceHtml
    .replace("../styles/site.css", versionedStylesheetUrl)
    .replace("../scripts/site/site-interactions.js", versionedInteractionScriptUrl)
    .replaceAll("../assets/", "./assets/")
    .replace(
      'property="og:image" content="./assets/share-surfaces/open-graph-preview-1200x630.png"',
      `property="og:image" content="${openGraphImageUrl}"`,
    )
    .replace(
      'property="twitter:image" content="./assets/share-surfaces/open-graph-preview-1200x630.png"',
      `property="twitter:image" content="${openGraphImageUrl}"`,
    )
    .replace("<!-- BUILD_ENVIRONMENT_HEAD -->", environmentHeadMarkup)
    .replace("<!-- BUILD_ENVIRONMENT_BANNER -->", environmentBannerMarkup)
    .replace("<body>", `<body data-release-channel="${buildMode}">`);
}

function buildRobotsText() {
  if (buildMode === "preview") {
    return "User-agent: *\nDisallow: /\n";
  }

  return "User-agent: *\nAllow: /\n";
}

rmSync(outputDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
mkdirSync(outputStylesDirectory, { recursive: true });
mkdirSync(outputScriptsDirectory, { recursive: true });
mkdirSync(outputAssetsDirectory, { recursive: true });

copyFileSync(sourceStylesPath, join(outputStylesDirectory, "site.css"));
copyFileSync(sourceInteractionScriptPath, join(outputScriptsDirectory, "site-interactions.js"));
copyFileSync(sourceFormConfigPath, join(outputScriptsDirectory, "form-configuration.js"));
copyFileSync(sourceSubmissionGatewayPath, join(outputScriptsDirectory, "submission-gateway.js"));
copyFileSync(sourceQrAttributionPath, join(outputScriptsDirectory, "qr-attribution.js"));
cpSync(sourceAssetsDirectory, outputAssetsDirectory, { recursive: true });

writeFileSync(join(outputDirectory, "index.html"), buildHtmlForMode());
writeFileSync(join(outputDirectory, "robots.txt"), buildRobotsText());
writeFileSync(
  join(outputDirectory, "release-metadata.json"),
  JSON.stringify(
    {
      buildMode,
      expectedBranch: buildMode === "preview" ? "staging" : "main",
      generatedAt: new Date().toISOString(),
      currentCommitSha,
      canonicalUrl: buildMode === "production" ? canonicalUrl || null : null,
      previewSeoBlocked: buildMode === "preview",
    },
    null,
    2,
  ),
);

console.log(`Built ${buildMode} artifact at ${outputDirectory}`);
