import { createWriteStream } from 'node:fs';
import archiver from 'archiver';

const out = createWriteStream('dist/gcp-namespace-revealer.zip');
const archive = archiver('zip', { zlib: { level: 9 } });

out.on('close', () => console.log(`ZIP written: ${archive.pointer()} bytes`));
archive.on('warning', (err) => { if (err.code !== 'ENOENT') throw err; });
archive.on('error', (err) => { throw err; });

archive.pipe(out);
archive.directory('dist/', false);
await archive.finalize();
