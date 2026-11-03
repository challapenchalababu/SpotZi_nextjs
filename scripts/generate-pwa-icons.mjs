import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const source = path.join(root, "src", "app", "spotzi-logo.png");
const outDir = path.join(root, "public", "icons");

if (!fs.existsSync(source)) {
  console.error(`Missing SpotZi logo at ${source}`);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

async function writeIcon(size, fileName, { maskable = false } = {}) {
  const canvas = maskable ? Math.round(size * 1.25) : size;
  const logoSize = maskable ? Math.round(size * 0.72) : Math.round(size * 0.86);
  const resized = await sharp(source)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 245, g: 250, b: 247, alpha: 1 } })
    .png()
    .toBuffer();

  const left = Math.floor((canvas - logoSize) / 2);
  const top = Math.floor((canvas - logoSize) / 2);

  await sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: { r: 245, g: 250, b: 247, alpha: 1 },
    },
  })
    .composite([{ input: resized, left, top }])
    .resize(size, size)
    .png()
    .toFile(path.join(outDir, fileName));
}

await writeIcon(192, "icon-192.png");
await writeIcon(512, "icon-512.png");
await writeIcon(192, "icon-maskable-192.png", { maskable: true });
await writeIcon(512, "icon-maskable-512.png", { maskable: true });
await writeIcon(180, "apple-touch-icon.png");

console.log("Generated SpotZi PWA icons in public/icons");
