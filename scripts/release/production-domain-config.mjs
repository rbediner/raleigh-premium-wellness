/**
 * Purpose: Keep the public production address in one version-controlled place.
 * Role: Gives the build, GitHub Pages publisher, and deployment verification
 *       the same canonical domain without relying on dashboard-only settings.
 */

export const productionDomain = "raleigh-premium-wellness.romanbediner.com";
export const productionCanonicalUrl = `https://${productionDomain}`;
