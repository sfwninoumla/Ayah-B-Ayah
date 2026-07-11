import { normalizeArabic } from "./arabic.js";

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
function normalizeDigits(text) {
  return text.replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

// Reusable picker used for both the surah and verse selectors: a trigger
// button in the footer that opens a modal overlay inside the popup, with an
// optional search input (tashkeel-insensitive) and a scrollable result list.
export function createDropdown({
  container,
  showSearch,
  onSelect,
  searchPlaceholder,
  title,
  wrapItems = false,
}) {
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "dropdown-trigger";
  container.appendChild(trigger);

  const overlay = document.createElement("div");
  overlay.className = "picker-overlay";
  overlay.hidden = true;

  const modal = document.createElement("div");
  modal.className = "picker-modal";
  overlay.appendChild(modal);

  const head = document.createElement("div");
  head.className = "picker-head";

  let searchInput = null;
  if (showSearch) {
    searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "picker-search";
    searchInput.placeholder = searchPlaceholder ?? "بحث…";
    searchInput.setAttribute("aria-label", searchPlaceholder ?? "بحث");
    head.appendChild(searchInput);
  } else if (title) {
    const titleEl = document.createElement("span");
    titleEl.className = "picker-title";
    titleEl.textContent = title;
    head.appendChild(titleEl);
  }

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "picker-close";
  closeBtn.setAttribute("aria-label", "إغلاق");
  closeBtn.textContent = "✕";
  head.appendChild(closeBtn);

  const list = document.createElement("ul");
  list.className = "picker-list";

  modal.appendChild(head);
  modal.appendChild(list);
  document.body.appendChild(overlay);

  let items = [];
  let debounceTimer = null;

  function renderList(filter) {
    const term = normalizeArabic(
      normalizeDigits((filter ?? "").trim().toLowerCase()),
    );
    list.innerHTML = "";
    const filtered = term
      ? items.filter((item) => item.searchText.includes(term))
      : items;
    for (const item of filtered) {
      const li = document.createElement("li");
      li.className = wrapItems ? "picker-item two-line" : "picker-item";
      li.textContent = item.label;
      li.addEventListener("click", () => {
        close();
        onSelect(item.value);
      });
      list.appendChild(li);
    }
    if (filtered.length === 0) {
      const li = document.createElement("li");
      li.className = "dropdown-empty";
      li.textContent = "لا توجد نتائج";
      list.appendChild(li);
    }
  }

  function onKeydown(e) {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
    }
  }

  function open() {
    overlay.hidden = false;
    trigger.classList.add("open");
    if (searchInput) {
      searchInput.value = "";
      searchInput.focus();
    }
    renderList("");
    document.addEventListener("keydown", onKeydown, true);
  }

  function close() {
    overlay.hidden = true;
    trigger.classList.remove("open");
    document.removeEventListener("keydown", onKeydown, true);
  }

  trigger.addEventListener("click", () => {
    if (overlay.hidden) open();
    else close();
  });

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => renderList(searchInput.value), 120);
    });
  }

  return {
    setItems(newItems) {
      items = newItems;
    },
    setLabel(label) {
      trigger.textContent = label;
    },
    close,
    destroy() {
      close();
      overlay.remove();
    },
  };
}
