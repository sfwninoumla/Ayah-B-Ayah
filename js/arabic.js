// Normalization for tashkeel-insensitive Arabic search. Applied to both the
// stored item search text and the user's query, so bare (unvocalized) input
// matches the fully-vocalized Uthmani-script Quran text.
// Unicode escapes only: literal Arabic chars in classes are bidi-ambiguous.
// U+064B-065F tashkeel + hamza marks, U+0670 superscript (dagger) alef,
// U+06D6-06ED Quranic annotation signs, U+0640 tatweel.
const DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;
// All alef forms (U+0627 U+0623 U+0625 U+0622 U+0671) are DELETED, not mapped:
// the Uthmani text spells words like \u0645\u0644\u0627\u0626\u0643\u0629 with a dagger alef where users
// type a full alef, so keeping alefs makes modern-spelling queries unmatchable.
const ALEF_FORMS = /[\u0627\u0623\u0625\u0622\u0671]/g;

export function normalizeArabic(text) {
  return text
    .replace(DIACRITICS, "")
    .replace(ALEF_FORMS, "")
    .replace(/\u0649/g, "\u064A") // alef maqsura -> ya
    .replace(/\u0629/g, "\u0647") // ta marbuta -> ha
    .replace(/\u0624/g, "\u0648") // hamza waw -> waw
    .replace(/\u0626/g, "\u064A"); // hamza ya -> ya
}
