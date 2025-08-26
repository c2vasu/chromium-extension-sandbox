const ta = document.getElementById('namespaces');
const statusEl = document.getElementById('status');
const previewEl = document.getElementById('preview');
const replaceModeEl = document.getElementById('replaceMode');

function toId(ns) {
  const h = md5(ns.toLowerCase());
  return 'x' + h.slice(0, 16);
}

function renderPreview(lines) {
  const map = {};
  lines.forEach(ns => { if (ns) map[toId(ns)] = ns; });
  const linesOut = Object.entries(map).map(([id, ns]) => `${id}  ->  ${ns}`);
  previewEl.textContent = linesOut.join('\n');
}

chrome.storage.local.get(['namespaceList','replaceMode'], (data) => {
  const list = data.namespaceList || [];
  ta.value = list.join('\n');
  renderPreview(list);
  replaceModeEl.checked = !!data.replaceMode;
});

ta.addEventListener('input', () => {
  const lines = ta.value.split('\n').map(s => s.trim()).filter(Boolean);
  renderPreview(lines);
});

document.getElementById('save').addEventListener('click', () => {
  const list = ta.value.split('\n').map(s => s.trim()).filter(Boolean);
  const idMap = {};
  list.forEach(ns => idMap[toId(ns)] = ns);
  const replaceMode = !!replaceModeEl.checked;
  chrome.storage.local.set({ namespaceList: list, idMap, replaceMode }, () => {
    statusEl.textContent = 'Saved ✓';
    setTimeout(() => statusEl.textContent = '', 1500);
  });
});
