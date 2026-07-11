// Persist the reader's last position via chrome.storage.local.
const KEY = "position";
const DEFAULT_POSITION = { surah: 1, ayah: 1 };

// chrome.storage is undefined when popup.html is opened as a plain page (dev
// preview); fall back to localStorage there. The installed extension always
// uses chrome.storage.local.
const extensionStorage = globalThis.chrome?.storage?.local;

export function getPosition() {
  if (!extensionStorage) {
    try {
      return Promise.resolve(JSON.parse(localStorage.getItem(KEY)) ?? DEFAULT_POSITION);
    } catch {
      return Promise.resolve(DEFAULT_POSITION);
    }
  }
  return new Promise((resolve) => {
    extensionStorage.get(KEY, (result) => {
      resolve(result[KEY] ?? DEFAULT_POSITION);
    });
  });
}

export function savePosition(position) {
  if (!extensionStorage) {
    localStorage.setItem(KEY, JSON.stringify(position));
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    extensionStorage.set({ [KEY]: position }, resolve);
  });
}
