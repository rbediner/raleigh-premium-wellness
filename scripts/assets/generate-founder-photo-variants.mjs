/**
 * Purpose: Generate responsive founder-photo variants for the website so the
 * shipped asset sizes match the layout instead of sending the source image.
 * Role: Produces stable JPEG and WebP files that can be referenced directly by
 * the site and by QA tests across machines.
 * Dependencies: Node.js and sharp.
 * Risk: Low. This script reads one source image and overwrites generated
 * variants inside assets/optimized-images.
 */

import { mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const sourceImagePath = path.join("assets", "source-images", "rb-mb-social-photo-source.jpeg");
const outputDirectoryPath = path.join("assets", "optimized-images", "founders");
const imageWidths = [640, 960, 1280];

async function generateVariantFiles() {
  mkdirSync(outputDirectoryPath, { recursive: true });

  for (const imageWidth of imageWidths) {
    const fileStem = `rb-mb-social-photo-${imageWidth}`;
    const resizedImage = sharp(sourceImagePath).resize({
      width: imageWidth,
      height: imageWidth,
      fit: "cover",
      position: "attention",
    });

    await resizedImage
      .clone()
      .webp({ quality: 82, effort: 5 })
      .toFile(path.join(outputDirectoryPath, `${fileStem}.webp`));

    await resizedImage
      .clone()
      .jpeg({ quality: 84, mozjpeg: true })
      .toFile(path.join(outputDirectoryPath, `${fileStem}.jpg`));
  }

  console.log(`Generated founder image variants in ${outputDirectoryPath}.`);
}

generateVariantFiles().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
