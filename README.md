# Chromimum Extention Sandbox (GCP Namespace Revealer) (Translate Mode)

A simple Chrome MV3 extension that replaces hashed Cloud Run IDs (`x[0-9a-f]{16}`) with their full namespaces on the GCP Console. Toggle between replacing IDs (Translate) and appending `(namespace: …)` (Annotate).

## Features
- Translate mode: show full namespace (keep original ID in tooltip)
- Annotate mode: show ID plus `(namespace: …)`
- Local-only storage and computation (no network calls)

## How it works
- Compute IDs as `x + left16(md5(lower(namespace)))`
- Options page stores `namespaceList`, derived `idMap`, and `replaceMode` in `chrome.storage.local`
- Content script scans text nodes for matches and replaces/annotates them; uses a MutationObserver for dynamic updates

## Install (dev)
1. `npm install`
2. `npm run build` (copies `src` → `dist`)
3. Load unpacked: `chrome://extensions` → Developer mode → **Load unpacked** → select `dist/`
4. Open the extension's **Options** page, paste namespaces, Save, refresh GCP Console

## Build scripts
- `npm run build`: copy files into `dist/`
- `npm run zip`: create `dist/gcp-namespace-revealer.zip`
- `npm run dist`: build + zip

## Repo layout
- `src/` – extension sources (manifest/content/options/vendor)
- `tools/zip.js` – packs dist into zip
- `dist/` – build output

## License
MIT
