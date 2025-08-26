/**
 * Content script: Replace or annotate Cloud Run–style IDs found in page text.
 *
 * Behavior:
 * - Matches tokens of the form: `x` + 16 lowercase hex chars (e.g., xe9f7bdfef851a043)
 * - If a mapping (id -> namespace) exists:
 *    - replaceMode = true  → replace the token with the full namespace (and keep ID in a tooltip)
 *    - replaceMode = false → annotate: show "ID (namespace: ...)"
 * - Unknown IDs are left as-is.
 *
 * Performance/Safety:
 * - Only touches TEXT_NODEs that actually match the regex.
 * - Skips inputs/textarea to avoid interfering with user input.
 * - Uses a single MutationObserver to handle SPA/dynamic updates.
 */

// Global, precompiled regex: word boundary + x + 16 lowercase hex + word boundary.
// Example matched value: "xe9f7bdfef851a043"
const ID_REGEX = /\bx[0-9a-f]{16}\b/g;

/** @type {Record<string, string>} Populated from chrome.storage.local (id -> namespace). */
let idMap = {};

/** @type {boolean} true: replace IDs with namespace; false: annotate (ID + namespace). */
let replaceMode = true;

/**
 * Scan a TEXT_NODE for Cloud Run–style IDs and either replace or annotate them.
 *
 * @param {Node} node - A DOM text node that may contain one or more IDs to transform.
 *
 * Algorithm:
 *  1) Quickly bail if the node is null or not TEXT_NODE.
 *  2) Test with regex; if no match, return without touching the node.
 *  3) For each match:
 *     - Append the preceding plain text.
 *     - If the ID exists in idMap:
 *         - Replace mode: insert <abbr title="ID">namespace</abbr>
 *         - Annotate mode: insert <span><strong>ID</strong><span>(namespace: ...)</span></span>
 *       Else:
 *         - Append the original ID text unchanged.
 *  4) Append trailing text after the last match.
 *  5) Replace the original text node with the constructed DocumentFragment.
 */
function annotateOrReplaceTextNode(node) {
  // Guard: only process actual text nodes.
  if (!node || node.nodeType !== Node.TEXT_NODE) return;

  const text = node.nodeValue;

  // Fast path: skip nodes that do not contain our pattern at all.
  if (!ID_REGEX.test(text)) return;

  // Reset regex state because test() advances lastIndex when /g is set.
  ID_REGEX.lastIndex = 0;

  // Collect all matches (preserves indices).
  const matches = [...text.matchAll(ID_REGEX)];
  if (matches.length === 0) return;

  // We'll reconstruct this text node as a document fragment:
  // [plain-text][replacement/annotation][plain-text]...
  const parent = node.parentNode;
  const frag = document.createDocumentFragment();

  // Tracks the slice boundary after each match we process.
  let lastIndex = 0;

  // Iterate through every ID match found in this text node.
  for (const m of matches) {
    const id = m[0];       // matched token like "x<16-hex>"
    const idx = m.index;   // starting index of this token within the text

    // Append the untouched text preceding this match.
    frag.appendChild(document.createTextNode(text.slice(lastIndex, idx)));

    // Advance lastIndex to the end of the current match.
    lastIndex = idx + id.length;

    // Try to resolve the namespace for this ID from our local map.
    const ns = idMap[id];

    if (ns) {
      if (replaceMode) {
        // Translate/replace mode:
        // Replace the visible token with the full namespace,
        // but preserve the original ID as a tooltip for reference/auditing.
        const abbr = document.createElement('abbr');
        abbr.title = id; // hover reveals original ID
        abbr.textContent = ns; // show the namespace text inline
        // Subtle dotted underline to indicate a replacement without being intrusive.
        abbr.style.borderBottom = '1px dotted currentColor';
        frag.appendChild(abbr);
      } else {
        // Annotate mode:
        // Keep the original ID visible, add a subdued "(namespace: ...)" suffix.
        const wrap = document.createElement('span');

        const strong = document.createElement('strong');
        strong.textContent = id; // emphasize the original ID

        const ann = document.createElement('span');
        ann.textContent = `  (namespace: ${ns})`;
        // Styling: smaller, lighter, spaced a little from the ID
        ann.style.fontSize = '90%';
        ann.style.opacity = '0.75';
        ann.style.marginLeft = '4px';

        wrap.appendChild(strong);
        wrap.appendChild(ann);
        // Marker attribute (handy if you ever want to select/undo or style later).
        wrap.setAttribute('data-gcp-ns-annotated', '1');

        frag.appendChild(wrap);
      }
    } else {
      // Unknown ID: emit the original token unchanged to avoid misrepresenting data.
      frag.appendChild(document.createTextNode(id));
    }
  }

  // Append any trailing text after the final match.
  frag.appendChild(document.createTextNode(text.slice(lastIndex)));

  // Atomically replace the original TEXT_NODE with our reconstructed fragment.
  // Using a fragment minimizes layout thrash and preserves sibling structure.
  parent.replaceChild(frag, node);
}

/**
 * Depth-first walk of the DOM subtree, processing TEXT_NODEs that may contain IDs.
 * Skips INPUT and TEXTAREA elements to avoid interfering with user-typed content.
 *
 * @param {Node} node - Root node to process.
 */
function walk(node) {
  // If it's a text node, attempt to transform it and return (text nodes have no children).
  if (node.nodeType === Node.TEXT_NODE) {
    annotateOrReplaceTextNode(node);
    return;
  }

  // Only traverse element nodes further (skip comments, etc.).
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  // Avoid modifying user inputs.
  const tag = node.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;

  // Recurse through the children in a stable forward iteration.
  for (let child = node.firstChild; child; child = child.nextSibling) {
    walk(child);
  }
}

/**
 * Observe dynamic page changes. Many GCP Console screens are SPA-like and
 * mutate the DOM after initial load. This observer ensures newly added nodes
 * or text changes are processed consistently.
 *
 * Implementation details:
 * - childList + subtree: catch added/removed nodes anywhere under <html>.
 * - characterData: catch in-place text edits (e.g., reactive components).
 */
function observe() {
  const obs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      // Handle nodes inserted into the DOM
      for (const n of m.addedNodes) {
        if (n.nodeType === Node.TEXT_NODE) {
          annotateOrReplaceTextNode(n);
        } else if (n.nodeType === Node.ELEMENT_NODE) {
          walk(n);
        }
      }

      // Handle direct text mutations (e.g., node.nodeValue changes)
      if (m.type === 'characterData' && m.target?.nodeType === Node.TEXT_NODE) {
        annotateOrReplaceTextNode(m.target);
      }
    }
  });

  // Observe the entire document for structural and text changes.
  obs.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

/**
 * Bootstrap:
 * - Load the ID map and replace mode from chrome.storage.local.
 * - Perform an initial DOM pass.
 * - Start observing for dynamic changes.
 */
chrome.storage.local.get(['idMap', 'replaceMode'], (data) => {
  // idMap: { "x<16-hex>": "Namespace.Value", ... }
  idMap = data.idMap || {};

  // replaceMode: default to true (translate) when undefined.
  replaceMode = data.replaceMode !== undefined ? !!data.replaceMode : true;

  // Initial sweep over the current document content.
  walk(document.body);

  // Handle subsequent dynamic content.
  observe();
});

/**
 * React to runtime changes in options (Options page updates).
 * This lets the content script adapt without a manual page reload:
 * - New/edited namespace mappings
 * - Mode toggling (replace vs annotate)
 */
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;

  if (changes.idMap) {
    idMap = changes.idMap.newValue || {};
  }
  if (changes.replaceMode) {
    replaceMode = !!changes.replaceMode.newValue;
  }
});
