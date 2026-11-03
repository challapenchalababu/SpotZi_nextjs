import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const source = path.join(root, "public", "brand", "spotzi-logo-original.png");
const outDir = path.join(root, "public", "icons");
const BG = { r: 245, g: 250, b: 247, alpha: 1 };

if (!fs.existsSync(source)) {
  console.error(`Missing original SpotZi logo at ${source}`);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

/**
 * Android splash / maskable icons crop to a center safe zone (~80%).
 * Using the tall full wordmark gets the tagline and lower letters cut off.
 * These icons use the original mark (pin + map + bag) on the SpotZi light background.
 */
async function extractMark(trimmed) {
  const meta = await sharp(trimmed).metadata();
  const width = meta.width || 1;
  const height = meta.height || 1;

  // Original lockup is emblem on top, wordmark below. Keep the upper mark only.
  const markHeight = Math.max(1, Math.round(height * 0.58));
  return sharp(trimmed)
    .extract({ left: 0, top: 0, width, height: markHeight })
    .trim({ threshold: 12 })
    .png()
    .toBuffer();
}

async function writeIcon(size, fileName, { maskable = false, markBuffer }) {
  // Maskable safe zone is the center 80%. Keep the mark inside ~70% so splash never clips.
  const markFit = maskable ? Math.round(size * 0.62) : Math.round(size * 0.72);
  const resizedMark = await sharp(markBuffer)
    .resize(markFit, markFit, {
      fit: "contain",
      background: BG,
    })
    .png()
    .toBuffer();

  const markMeta = await sharp(resizedMark).metadata();
  const markW = markMeta.width || markFit;
  const markH = markMeta.height || markFit;
  const left = Math.floor((size - markW) / 2);
  const top = Math.floor((size - markH) / 2);

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: resizedMark, left, top }])
    .png()
    .toFile(path.join(outDir, fileName));
}

const trimmed = await sharp(source)
  .trim({ threshold: 8 })
  .png()
  .toBuffer();

const markBuffer = await extractMark(trimmed);

// Also keep a full-lockup splash/fallback asset for reference / future use.
await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: BG,
  },
})
  .composite([
    {
      input: await sharp(trimmed)
        .resize(Math.round(512 * 0.78), Math.round(512 * 0.78), {
          fit: "contain",
          background: BG,
        })
        .png()
        .toBuffer(),
      gravity: "centre",
    },
  ])
  .png()
  .toFile(path.join(outDir, "icon-full-lockup-512.png"));

await writeIcon(192, "icon-192.png", { markBuffer });
await writeIcon(512, "icon-512.png", { markBuffer });
await writeIcon(192, "icon-maskable-192.png", { markBuffer, maskable: true });
await writeIcon(512, "icon-maskable-512.png", { markBuffer, maskable: true });
await writeIcon(180, "apple-touch-icon.png", { markBuffer });

console.log("Generated SpotZi PWA icons from original logo mark");
