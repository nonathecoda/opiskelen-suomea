// Draws every picture the installed app needs, from the SVGs in brand/:
// the home-screen icons, and the iOS launch screens that stand in for the white flash.
//
//   node scripts/brand-assets.mjs
//
// It uses sharp, which comes with Next (it is not a dependency of its own). The output is
// committed, so this runs only when the mark changes. Nothing in brand/ is written to.

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

/** The app's paper, Discord Black (--bg in globals.css): what the launch screens are filled with. */
const PAPER = "#000000";
/** Discord's Blurple, the tile's colour: what fills the corners of the Apple icon, which iOS rounds by itself. */
const BLURPLE = "#5865f2";
/** The tile on the launch screens in CSS pixels: the splash's --splash-size, 6rem at 16px (globals.css). */
const TILE = 96;
/** Apple's icon is always 180 by 180. */
const APPLE_ICON = 180;

/**
 * Each iPhone and iPad, portrait: width and height in CSS points, and pixels per point.
 * Keep the list in step with `startupImage` in src/app/layout.tsx.
 */
const DEVICES = [
  [440, 956, 3],
  [430, 932, 3],
  [428, 926, 3],
  [420, 912, 3],
  [414, 896, 3],
  [414, 896, 2],
  [402, 874, 3],
  [393, 852, 3],
  [390, 844, 3],
  [375, 812, 3],
  [375, 667, 2],
  [414, 736, 3],
  [768, 1024, 2],
  [820, 1180, 2],
  [834, 1194, 2],
  [1024, 1366, 2],
];

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const brand = (name) => readFile(path.join(root, "brand", name), "utf8");

/** The SVG at an exact size in pixels. The density is set first so curves are drawn at that size, not scaled up. */
function raster(svg, size) {
  return sharp(Buffer.from(svg), { density: (72 * size) / 512 }).resize(size, size);
}

/** Smallest file for flat art: nothing here is photographic, so every pixel keeps its colour. */
const PNG = { compressionLevel: 9, effort: 10 };

async function write(file, image, options = PNG) {
  const target = path.join(root, file);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, await image.png(options).toBuffer());
  const { width, height, hasAlpha } = await sharp(target).metadata();
  const { size } = await stat(target);
  console.log(`${file}  ${width}x${height}  ${hasAlpha ? "alpha" : "opaque"}  ${size} bytes`);
}

/** What lies between the outer <svg> tags, so the icon can be placed inside a larger picture. */
function inside(svg) {
  return svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/)[1];
}

/** A launch screen: paper to the edges, the icon tile in the middle, as the splash draws it. */
function launchScreen(icon, [width, height, ratio]) {
  const [w, h, tile] = [width * ratio, height * ratio, TILE * ratio];
  // Where the splash puts it: dead centre of the screen. On a phone of odd size that is half a pixel.
  const [x, y] = [(w - tile) / 2, (h - tile) / 2];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${PAPER}"/>
  <svg x="${x}" y="${y}" width="${tile}" height="${tile}" viewBox="0 0 512 512">${inside(icon)}</svg>
</svg>`;
  return sharp(Buffer.from(svg), { density: 72 });
}

const icon = await brand("icon.svg");
const maskable = await brand("icon-maskable.svg");
const monochrome = await brand("icon-monochrome.svg");

// The icon, with the see-through corners of its rounded tile.
for (const size of [192, 512]) {
  await write(`public/icons/icon-${size}.png`, raster(icon, size));
}

// The same on a full Blurple square, with the mark inside Android's safe circle: Android cuts its own shape.
for (const size of [192, 512]) {
  await write(`public/icons/icon-maskable-${size}.png`, raster(maskable, size).removeAlpha());
}

// The mark alone, for Android to tint.
await write("public/icons/icon-monochrome-512.png", raster(monochrome, 512));

// iOS shows the whole square and rounds it itself, so this one has no corners and no alpha.
// It is drawn from the icon rather than the maskable art: that one keeps its mark small for Android's
// circle and would look lost here. The icon's own tile has the corner radius iOS uses, so the mark
// sits the same in it. The corners are filled with Blurple before they can show through.
await write("src/app/apple-icon.png", raster(icon, APPLE_ICON).flatten({ background: BLURPLE }));

// Flat colour and a few edge tones: a palette of 256 holds it exactly and the files stay small.
for (const device of DEVICES) {
  const [width, height, ratio] = device;
  const name = `apple-splash-${width * ratio}x${height * ratio}.png`;
  await write(`public/splash/${name}`, launchScreen(icon, device), { ...PNG, palette: true, colours: 256, dither: 0 });
}
