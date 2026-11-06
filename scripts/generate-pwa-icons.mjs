// Regenerates the PWA/favicon PNGs from the Hot Knots pretzel-knot photo.
// Run with: node scripts/generate-pwa-icons.mjs

import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const appDir = join(__dirname, "..", "src", "app");
mkdirSync(publicDir, { recursive: true });

const MARK = join(publicDir, "pretzel.png");
const BG = "#fbf4e4"; // Hot Knots cream background

// Renders the pretzel mark padded onto a square canvas. `padPercent` controls
// how much breathing room surrounds it — maskable icons need more, since the
// OS crops anything outside the center ~80% "safe zone".
async function renderIcon(size, outPath, padPercent = 0.1) {
  const pad = Math.round(size * padPercent);
  const inner = size - pad * 2;
  const mark = await sharp(MARK)
    .resize(inner, inner, { fit: "contain", background: BG })
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 3, background: BG },
  })
    .composite([{ input: mark, left: pad, top: pad }])
    .png()
    .toFile(outPath);
  console.log("wrote", outPath);
}

async function main() {
  await renderIcon(192, join(publicDir, "icon-192.png"));
  await renderIcon(512, join(publicDir, "icon-512.png"));
  await renderIcon(512, join(publicDir, "icon-512-maskable.png"), 0.2);
  await renderIcon(180, join(publicDir, "apple-touch-icon.png"));
  await renderIcon(32, join(appDir, "icon.png"), 0.04);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
