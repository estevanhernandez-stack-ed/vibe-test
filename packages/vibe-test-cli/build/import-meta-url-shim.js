// Injected shim (esbuild `inject`) that provides a CJS-safe value for
// `import.meta.url`. The engine's bundled ESM code resolves package-relative
// asset paths via `fileURLToPath(import.meta.url)`; in a CJS bundle that value
// is empty, so we redirect it (via tsup `define`) to this identifier, which
// holds a proper file:// URL of the running bundle.
const { pathToFileURL } = require('node:url');

// `__filename` is the absolute path of the emitted dist/index.js at runtime.
export const IMPORT_META_URL_SHIM = pathToFileURL(__filename).href;
