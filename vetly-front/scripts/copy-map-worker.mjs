// MapLibre decodes map tiles in a web worker loaded from a separate file. Bundlers move the library's
// code into hashed chunks, so the worker is served from public/ instead and set with setWorkerUrl().
// Runs before `dev` and `build`; the copy always matches the installed maplibre-gl version.
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const source = require.resolve('maplibre-gl/dist/maplibre-gl-worker.mjs');
const target = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'vendor', 'maplibre-gl-worker.mjs');
mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
