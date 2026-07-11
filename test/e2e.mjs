// E2E suite: modal picker, tashkeel-insensitive search, bundled font, and
// navigation/persistence regressions. 21 checks, no dependencies (Node >= 22).
//
// How to run (three terminals or background the first two):
//   1. Serve the extension dir (storage.js/data.js fall back to web APIs):
//        python3 -m http.server 8749 --bind 127.0.0.1
//   2. Headless Chrome with CDP — use a FRESH profile dir, the "initial ayah"
//      check expects no previously saved position:
//        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
//          --headless=new --remote-debugging-port=9224 \
//          --user-data-dir=/tmp/oq-test-profile about:blank
//   3. node test/e2e.mjs   → expect "ALL PASS"
const DEBUG_PORT = 9224;
const PAGE_URL = "http://127.0.0.1:8749/popup.html";

const tab = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?${PAGE_URL}`, { method: "PUT" })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));

let msgId = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
};
function send(method, params = {}) {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((r) => pending.set(id, r));
}
async function evaluate(expr) {
  const res = await send("Runtime.evaluate", { expression: `(() => { ${expr} })()`, awaitPromise: true, returnByValue: true });
  if (res.result?.exceptionDetails) throw new Error(JSON.stringify(res.result.exceptionDetails));
  return res.result?.result?.value;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
function check(name, actual, expected) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  results.push(pass);
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}  ${pass ? "" : `→ got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`}`);
}

await send("Page.enable");
await sleep(1500);

// ---- font: the exact bundled Amiri Quran must be loaded and applied
const fontLoaded = await evaluate(`
  return document.fonts.ready.then(() => document.fonts.check('24px "Amiri Quran"'));
`);
check("Amiri Quran font loaded", fontLoaded, true);

// ---- regression: initial state
check("initial ayah", await evaluate(`return document.getElementById("ayah-count").textContent`), "الآية ١ من ٧");

// ---- surah modal: open, search WITHOUT tashkeel and with ه instead of ة
await evaluate(`document.querySelector("#surah-dropdown-container .dropdown-trigger").click()`);
await sleep(150);
check("surah overlay opens", await evaluate(`return [...document.querySelectorAll(".picker-overlay")].some(o => !o.hidden)`), true);
check("open overlay visually rendered", await evaluate(`return getComputedStyle(document.querySelector(".picker-overlay:not([hidden])")).display`), "flex");
check("other overlay visually hidden", await evaluate(`return [...document.querySelectorAll(".picker-overlay[hidden]")].every(o => getComputedStyle(o).display === "none")`), true);
check("search focused on open", await evaluate(`return document.activeElement.className`), "picker-search");
await evaluate(`
  const inp = document.querySelector(".picker-overlay:not([hidden]) .picker-search");
  inp.value = "الفاتحه";
  inp.dispatchEvent(new Event("input"));
`);
await sleep(250);
check("surah bare-search 'الفاتحه' finds الفاتحة", await evaluate(`return [...document.querySelectorAll(".picker-overlay:not([hidden]) .picker-item")].map(li => li.textContent)`), ["١. الفاتحة"]);

// Escape closes
await evaluate(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))`);
await sleep(100);
check("Escape closes modal", await evaluate(`return [...document.querySelectorAll(".picker-overlay")].every(o => o.hidden)`), true);
check("closed overlays visually gone", await evaluate(`return [...document.querySelectorAll(".picker-overlay")].every(o => getComputedStyle(o).display === "none")`), true);

// ---- jump to surah 2 via search "2"
await evaluate(`document.querySelector("#surah-dropdown-container .dropdown-trigger").click()`);
await sleep(100);
await evaluate(`
  const inp = document.querySelector(".picker-overlay:not([hidden]) .picker-search");
  inp.value = "٢";
  inp.dispatchEvent(new Event("input"));
`);
await sleep(250);
await evaluate(`[...document.querySelectorAll(".picker-overlay:not([hidden]) .picker-item")].find(li => li.textContent === "٢. البقرة").click()`);
await sleep(250);
check("Arabic-digit surah search + select → البقرة", await evaluate(`return document.getElementById("surah-name").textContent`), "البقرة");

// ---- verse modal on surah 2: bare-Arabic text search (2:30 وَإِذْ قَالَ رَبُّكَ)
await evaluate(`document.querySelector("#verse-dropdown-container .dropdown-trigger").click()`);
await sleep(150);
await evaluate(`
  const inp = document.querySelector(".picker-overlay:not([hidden]) .picker-search");
  inp.value = "واذ قال ربك للملايكه";
  inp.dispatchEvent(new Event("input"));
`);
await sleep(300);
const bareResults = await evaluate(`return [...document.querySelectorAll(".picker-overlay:not([hidden]) .picker-item")].map(li => li.textContent.slice(0, 12))`);
console.log("   bare verse search results:", bareResults);
check("bare-Arabic verse search finds 2:30", bareResults.length >= 1 && bareResults[0].startsWith("٣٠."), true);
check("verse items use two-line wrap", await evaluate(`return document.querySelector(".picker-overlay:not([hidden]) .picker-item").classList.contains("two-line")`), true);
await evaluate(`document.querySelector(".picker-overlay:not([hidden]) .picker-item").click()`);
await sleep(250);
check("selecting result navigates to 2:30", await evaluate(`return document.getElementById("ayah-count").textContent`), "الآية ٣٠ من ٢٨٦");

// ---- backdrop click closes
await evaluate(`document.querySelector("#verse-dropdown-container .dropdown-trigger").click()`);
await sleep(100);
await evaluate(`document.querySelector(".picker-overlay:not([hidden])").click()`);
await sleep(100);
check("backdrop click closes", await evaluate(`return [...document.querySelectorAll(".picker-overlay")].every(o => o.hidden)`), true);

// ---- ✕ button closes
await evaluate(`document.querySelector("#verse-dropdown-container .dropdown-trigger").click()`);
await sleep(100);
await evaluate(`document.querySelector(".picker-overlay:not([hidden]) .picker-close").click()`);
await sleep(100);
check("close button closes", await evaluate(`return [...document.querySelectorAll(".picker-overlay")].every(o => o.hidden)`), true);

// ---- small surah 103: no search input, title instead; no overlay leak after many renders
await evaluate(`localStorage.setItem("position", JSON.stringify({surah:103, ayah:1}))`);
await send("Page.reload");
await sleep(1800);
for (let i = 0; i < 3; i++) { await evaluate(`document.getElementById("next-btn").click()`); await sleep(120); }
check("no overlay leak after renders (2 pickers)", await evaluate(`return document.querySelectorAll(".picker-overlay").length`), 2);
await evaluate(`document.querySelector("#verse-dropdown-container .dropdown-trigger").click()`);
await sleep(100);
check("surah 104 few verses → no search input", await evaluate(`return !!document.querySelector(".picker-overlay:not([hidden]) .picker-search")`), false);
check("title shown instead", await evaluate(`return document.querySelector(".picker-overlay:not([hidden]) .picker-title")?.textContent`), "اختر الآية");
await evaluate(`document.querySelector(".picker-overlay:not([hidden]) .picker-close").click()`);

// ---- regression: boundary + persistence
await evaluate(`localStorage.setItem("position", JSON.stringify({surah:114, ayah:6}))`);
await send("Page.reload");
await sleep(1800);
check("next disabled at 114:6", await evaluate(`return document.getElementById("next-btn").disabled`), true);
check("position restored", await evaluate(`return document.getElementById("ayah-count").textContent`), "الآية ٦ من ٦");

console.log(results.every(Boolean) ? "\nALL PASS" : "\nSOME FAILED");
ws.close();
