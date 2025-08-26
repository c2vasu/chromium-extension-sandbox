/**
 * options.js – Options page logic for GCP Namespace Revealer
 * ----------------------------------------------------------
 * Purpose:
 * - Handles user input (namespaces + replace mode toggle).
 * - Computes Cloud Run IDs using md5(lower(namespace)), left 16 chars.
 * - Renders a live preview of ID → namespace mappings.
 * - Persists data in chrome.storage.local for the content script to use.
 *
 * Key workflow:
 * - On load: restore settings from storage, show preview, set checkbox state.
 * - On input: update preview dynamically as user types.
 * - On save: normalize + persist namespace list, idMap, and replaceMode.
 */

// Grab DOM elements once (caching for performance/readability)
const ta = document.getElementById('namespaces');   // Textarea for namespace list
const statusEl = document.getElementById('status'); // Span for "Saved ✓" messages
const previewEl = document.getElementById('preview'); // <pre> block showing ID → Namespace
const replaceModeEl = document.getElementById('replaceMode'); // Checkbox toggle

/**
 * Convert a namespace string into a Cloud Run ID.
 *
 * Algorithm:
 *   id = "x" + left16( md5( lower(namespace) ) )
 *
 * @param {string} ns - A namespace string (case-insensitive).
 * @returns {string} - Computed Cloud Run ID (e.g., xe9f7bdfef851a043).
 */
function toId(ns) {
  const h = md5(ns.toLowerCase()); // md5 hash of lowercase namespace
  return 'x' + h.slice(0, 16);     // prepend 'x' and take first 16 chars
}

/**
 * Render a preview of ID → Namespace mappings in the preview <pre>.
 *
 * @param {string[]} lines - Array of namespace strings.
 */
function renderPreview(lines) {
  const map = {};
  // Build ID → Namespace mapping (deduplicate if same ID repeats)
  lines.forEach(ns => { if (ns) map[toId(ns)] = ns; });

  // Format lines: "x1234abcd...  ->  Namespace"
  const linesOut = Object.entries(map).map(([id, ns]) => `${id}  ->  ${ns}`);

  // Replace preview content
  previewEl.textContent = linesOut.join('\n');
}

/**
 * On load: restore saved settings from chrome.storage.local.
 * - Fill textarea with saved namespace list.
 * - Render preview.
 * - Restore replaceMode checkbox state.
 */
chrome.storage.local.get(['namespaceList','replaceMode'], (data) => {
  const list = data.namespaceList || [];
  ta.value = list.join('\n');             // show saved namespaces
  renderPreview(list);                    // show preview of saved list
  replaceModeEl.checked = !!data.replaceMode; // restore mode toggle
});

/**
 * On textarea input: update preview live as user types/pastes.
 * - Splits by newline, trims whitespace, drops empty lines.
 */
ta.addEventListener('input', () => {
  const lines = ta.value
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean); // keep only non-empty
  renderPreview(lines);
});

/**
 * On Save button click:
 * - Normalize and clean namespace list.
 * - Compute idMap: { id: namespace }.
 * - Read replaceMode toggle.
 * - Save all three to chrome.storage.local.
 * - Show transient "Saved ✓" status message.
 */
document.getElementById('save').addEventListener('click', () => {
  const list = ta.value
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);

  const idMap = {};
  list.forEach(ns => idMap[toId(ns)] = ns);

  const replaceMode = !!replaceModeEl.checked;

  chrome.storage.local.set({ namespaceList: list, idMap, replaceMode }, () => {
    statusEl.textContent = 'Saved ✓';
    // Clear status message after 1.5 seconds
    setTimeout(() => statusEl.textContent = '', 1500);
  });
});
