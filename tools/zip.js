/**
 * tools/zip.js – Packager for Chrome Extension build
 * ---------------------------------------------------
 * Purpose:
 * - Creates a compressed .zip archive of the contents of the `dist/` folder.
 * - This zip can then be uploaded to the Chrome Web Store or shared.
 *
 * Implementation:
 * - Uses Node's fs (createWriteStream) to create an output file stream.
 * - Uses the `archiver` library to stream files into a ZIP format.
 * - High compression (zlib level 9).
 * - Logs size once completed, and handles errors gracefully.
 */

import { createWriteStream } from 'node:fs'; // For writing the zip file
import archiver from 'archiver';             // Library to create .zip archives

// Create a writable stream to the target zip file.
// All compressed data will be piped into this file.
const out = createWriteStream('dist/gcp-namespace-revealer.zip');

// Create a new archiver instance configured for ZIP format.
// zlib level 9 = maximum compression.
const archive = archiver('zip', { zlib: { level: 9 } });

// Event: when the stream is closed (archive finalized successfully).
// archive.pointer() returns the number of bytes written.
out.on('close', () => console.log(`ZIP written: ${archive.pointer()} bytes`));

// Event: handle non-fatal warnings (e.g., file not found).
// ENOENT is usually ignorable; anything else is thrown as an error.
archive.on('warning', (err) => { 
  if (err.code !== 'ENOENT') throw err; 
});

// Event: handle fatal errors (abort the process).
archive.on('error', (err) => { throw err; });

// Pipe archive data into the file stream.
// Everything written by `archive` goes into `out`.
archive.pipe(out);

// Add the entire contents of the `dist/` folder to the root of the zip.
//  - First arg: path to include.
//  - Second arg: false = do not prefix folder name in the archive.
archive.directory('dist/', false);

// Finalize the archive: signals that no more files will be added.
// Returns a promise, so we can `await` it in top-level async context.
await archive.finalize();
