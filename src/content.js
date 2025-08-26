const ID_REGEX = /\bx[0-9a-f]{16}\b/g;
let idMap = {};
let replaceMode = true;

function annotateOrReplaceTextNode(node) {
  if (!node || node.nodeType !== Node.TEXT_NODE) return;
  const text = node.nodeValue;
  if (!ID_REGEX.test(text)) return;
  ID_REGEX.lastIndex = 0;

  const matches = [...text.matchAll(ID_REGEX)];
  if (matches.length === 0) return;

  const parent = node.parentNode;
  const frag = document.createDocumentFragment();
  let lastIndex = 0;

  for (const m of matches) {
    const id = m[0];
    frag.appendChild(document.createTextNode(text.slice(lastIndex, m.index)));
    lastIndex = m.index + id.length;

    const ns = idMap[id];
    if (ns) {
      if (replaceMode) {
        const abbr = document.createElement('abbr');
        abbr.title = id;
        abbr.textContent = ns;
        abbr.style.borderBottom = '1px dotted currentColor';
        frag.appendChild(abbr);
      } else {
        const wrap = document.createElement('span');
        const strong = document.createElement('strong');
        strong.textContent = id;
        const ann = document.createElement('span');
        ann.textContent = `  (namespace: ${ns})`;
        ann.style.fontSize = '90%';
        ann.style.opacity = '0.75';
        ann.style.marginLeft = '4px';
        wrap.appendChild(strong);
        wrap.appendChild(ann);
        wrap.setAttribute('data-gcp-ns-annotated', '1');
        frag.appendChild(wrap);
      }
    } else {
      frag.appendChild(document.createTextNode(id));
    }
  }
  frag.appendChild(document.createTextNode(text.slice(lastIndex)));
  parent.replaceChild(frag, node);
}

function walk(node) {
  if (node.nodeType === Node.TEXT_NODE) { annotateOrReplaceTextNode(node); return; }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const tag = node.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' ) return;
  for (let child = node.firstChild; child; child = child.nextSibling) walk(child);
}

function observe() {
  const obs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (n.nodeType === Node.TEXT_NODE) annotateOrReplaceTextNode(n);
        else if (n.nodeType === Node.ELEMENT_NODE) walk(n);
      }
      if (m.type === 'characterData' && m.target?.nodeType === Node.TEXT_NODE) {
        annotateOrReplaceTextNode(m.target);
      }
    }
  });
  obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
}

chrome.storage.local.get(['idMap','replaceMode'], (data) => {
  idMap = data.idMap || {};
  replaceMode = data.replaceMode !== undefined ? !!data.replaceMode : true;
  walk(document.body);
  observe();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.idMap) idMap = changes.idMap.newValue || {};
  if (changes.replaceMode) replaceMode = !!changes.replaceMode.newValue;
});
