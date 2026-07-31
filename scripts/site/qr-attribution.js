/**
 * Purpose: Extract and clean QR campaign labels without changing a visitor's
 * destination, deep link, or other query parameters.
 * Role: Lets the entry module record a QR visit once, then remove the label so
 * copied links do not attribute later visitors to the original printed asset.
 * Dependencies: Browser-standard URL and URLSearchParams APIs only.
 * Risk: Low. Invalid labels are never emitted as analytics data, but are still
 * removed from the visible URL to preserve the clean-sharing behavior.
 */

const QR_SOURCE_PARAMETER = "qr";
const QR_SOURCE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function consumeQrAttribution(sourceUrl) {
  const currentUrl = new URL(sourceUrl);
  const rawQrSource = currentUrl.searchParams.get(QR_SOURCE_PARAMETER);

  if (rawQrSource === null) {
    return {
      cleanedUrl: currentUrl.toString(),
      qrSource: null,
    };
  }

  currentUrl.searchParams.delete(QR_SOURCE_PARAMETER);
  const normalizedQrSource = rawQrSource.trim().toLowerCase();

  return {
    cleanedUrl: currentUrl.toString(),
    qrSource: QR_SOURCE_PATTERN.test(normalizedQrSource) ? normalizedQrSource : null,
  };
}
