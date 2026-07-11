// One-time script: downloads Quran JSON data from semarketir/quranjson into data/.
// Usage: node scripts/fetch-data.mjs
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const SURAH_DIR = path.join(DATA_DIR, "surah");
const BASE = "https://raw.githubusercontent.com/semarketir/quranjson/master/source";

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

async function main() {
  await mkdir(SURAH_DIR, { recursive: true });

  console.log("Fetching surah index...");
  const index = await fetchJson(`${BASE}/surah.json`);
  await writeFile(
    path.join(DATA_DIR, "surah-index.json"),
    JSON.stringify(index),
  );
  console.log(`Saved surah-index.json (${index.length} surahs)`);

  for (let n = 1; n <= 114; n++) {
    const url = `${BASE}/surah/surah_${n}.json`;
    const surah = await fetchJson(url);
    await writeFile(
      path.join(SURAH_DIR, `surah_${n}.json`),
      JSON.stringify(surah),
    );
    console.log(`Saved surah_${n}.json`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
