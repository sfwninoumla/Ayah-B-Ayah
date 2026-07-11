// One-time script: downloads the exact "Amiri Quran" webfont files that
// fonts.google.com serves to Chrome, into fonts/. The woff2 URLs come from
// https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap
// fetched with a Chrome User-Agent (the default UA is served a ttf instead).
// Usage: node scripts/fetch-font.mjs
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.join(__dirname, "..", "fonts");
const CHROME_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const CSS_URL = "https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap";

async function main() {
  await mkdir(FONT_DIR, { recursive: true });

  const css = await (await fetch(CSS_URL, { headers: { "User-Agent": CHROME_UA } })).text();
  const blocks = [...css.matchAll(/\/\* (\w+) \*\/[^}]*?src: url\((\S+?\.woff2)\)/g)];
  if (blocks.length === 0) throw new Error("No woff2 URLs found in Google Fonts CSS");

  for (const [, subset, url] of blocks) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    const dest = path.join(FONT_DIR, `amiri-quran-${subset}.woff2`);
    await writeFile(dest, Buffer.from(await res.arrayBuffer()));
    console.log(`Saved ${dest}`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
