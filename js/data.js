// Lazy-loading access to the bundled Quran data (surah index + per-surah text).
const surahCache = new Map();
let indexPromise = null;

// chrome.runtime is undefined when popup.html is opened as a plain page (dev preview).
function surahUrl(path) {
  return globalThis.chrome?.runtime?.getURL ? chrome.runtime.getURL(path) : path;
}

export function loadIndex() {
  if (!indexPromise) {
    indexPromise = fetch(surahUrl("data/surah-index.json")).then((res) =>
      res.json(),
    );
  }
  return indexPromise;
}

export async function loadSurah(n) {
  if (surahCache.has(n)) return surahCache.get(n);
  const res = await fetch(surahUrl(`data/surah/surah_${n}.json`));
  const surah = await res.json();
  surahCache.set(n, surah);
  return surah;
}

// Numbered ayah keys only, in order (ignores the decorative verse_0 bismillah).
export function getAyahKeys(surah) {
  return Object.keys(surah.verse)
    .filter((key) => key !== "verse_0")
    .sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)));
}

export function getAyahText(surah, ayah) {
  const text = surah.verse[`verse_${ayah}`] ?? "";
  return text.replace(/^﻿/, "");
}

export function getJuz(surahMeta, ayah) {
  for (const range of surahMeta.juz) {
    const start = Number(range.verse.start.slice(6));
    const end = Number(range.verse.end.slice(6));
    if (ayah >= start && ayah <= end) return Number(range.index);
  }
  return null;
}
