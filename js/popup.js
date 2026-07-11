import {
  loadIndex,
  loadSurah,
  getAyahKeys,
  getAyahText,
  getJuz,
} from "./data.js";
import { getPosition, savePosition } from "./storage.js";
import { createDropdown } from "./dropdown.js";
import { normalizeArabic } from "./arabic.js";

const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
function toArabicDigits(n) {
  return String(n).replace(/[0-9]/g, (d) => ARABIC_DIGITS[d]);
}

const surahNameEl = document.getElementById("surah-name");
const ayahCountEl = document.getElementById("ayah-count");
const juzNumberEl = document.getElementById("juz-number");
const ayahTextEl = document.getElementById("ayah-text");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");

let surahIndex = []; // array of surah metadata, 0-indexed by (number - 1)
let currentSurah = 1;
let currentAyah = 1;
let currentSurahData = null; // cached parsed surah_N.json

const surahDropdown = createDropdown({
  container: document.getElementById("surah-dropdown-container"),
  showSearch: true,
  searchPlaceholder: "بحث بالاسم أو الرقم…",
  onSelect: (surahNumber) => goTo(surahNumber, 1),
});

let verseDropdown = null;

function surahMeta(n) {
  return surahIndex[n - 1];
}

function renderSurahDropdownItems() {
  const items = surahIndex.map((meta) => {
    const n = Number(meta.index);
    return {
      value: n,
      label: `${toArabicDigits(n)}. ${meta.titleAr}`,
      searchText: `${normalizeArabic(meta.titleAr)}${n}`.toLowerCase(),
    };
  });
  surahDropdown.setItems(items);
}

function renderVerseDropdown(surah, meta) {
  const container = document.getElementById("verse-dropdown-container");
  verseDropdown?.destroy(); // remove the previous picker's overlay from <body>
  container.innerHTML = "";
  const count = Number(meta.count);
  verseDropdown = createDropdown({
    container,
    showSearch: count > 20,
    searchPlaceholder: "بحث بالرقم أو النص…",
    title: "اختر الآية",
    wrapItems: true,
    onSelect: (ayahNumber) => goTo(currentSurah, ayahNumber),
  });
  const keys = getAyahKeys(surah);
  const items = keys.map((key) => {
    const n = Number(key.slice(6));
    const text = getAyahText(surah, n);
    return {
      value: n,
      label: `${toArabicDigits(n)}. ${text}`,
      searchText: `${normalizeArabic(text)}${n}`.toLowerCase(),
    };
  });
  verseDropdown.setItems(items);
}

async function render() {
  const meta = surahMeta(currentSurah);
  currentSurahData = await loadSurah(currentSurah);

  surahNameEl.textContent = meta.titleAr;
  ayahCountEl.textContent = `الآية ${toArabicDigits(currentAyah)} من ${toArabicDigits(meta.count)}`;
  const juz = getJuz(meta, currentAyah);
  juzNumberEl.textContent = juz ? `الجزء ${toArabicDigits(juz)}` : "";

  ayahTextEl.textContent = `${getAyahText(currentSurahData, currentAyah)} `;
  const inlineMarker = document.createElement("span");
  inlineMarker.className = "ayah-marker";
  inlineMarker.textContent = `﴿${toArabicDigits(currentAyah)}﴾`;
  ayahTextEl.appendChild(inlineMarker);

  surahDropdown.setLabel(`${toArabicDigits(currentSurah)}. ${meta.titleAr}`);
  renderVerseDropdown(currentSurahData, meta);
  verseDropdown.setLabel(`${toArabicDigits(currentAyah)}`);

  prevBtn.disabled = currentSurah === 1 && currentAyah === 1;
  nextBtn.disabled = currentSurah === 114 && currentAyah === Number(meta.count);

  await savePosition({ surah: currentSurah, ayah: currentAyah });
}

async function goTo(surah, ayah) {
  currentSurah = surah;
  currentAyah = ayah;
  await render();
}

async function goNext() {
  const meta = surahMeta(currentSurah);
  if (currentAyah < Number(meta.count)) {
    await goTo(currentSurah, currentAyah + 1);
  } else if (currentSurah < 114) {
    await goTo(currentSurah + 1, 1);
  }
}

async function goPrev() {
  if (currentAyah > 1) {
    await goTo(currentSurah, currentAyah - 1);
  } else if (currentSurah > 1) {
    const prevMeta = surahMeta(currentSurah - 1);
    await goTo(currentSurah - 1, Number(prevMeta.count));
  }
}

prevBtn.addEventListener("click", goPrev);
nextBtn.addEventListener("click", goNext);

document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;
  if (e.key === "ArrowLeft") goNext();
  if (e.key === "ArrowRight") goPrev();
});

async function init() {
  surahIndex = await loadIndex();
  renderSurahDropdownItems();

  const position = await getPosition();
  currentSurah = position.surah;
  currentAyah = position.ayah;

  await render();
}

init();
