import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, type Options } from 'tsup';

/**
 * Standalone-bundle build for @esthernandez/vibe-test-cli.
 *
 * The CLI used to carry @esthernandez/vibe-test as a RUNTIME dependency (tsup
 * treats `dependencies` as external by default). The engine library is being
 * deprecated on npm, so this build instead BUNDLES the engine — and its whole
 * transitive tree — into dist/index.js. After this, the published CLI requires
 * nothing at runtime but Node itself.
 *
 * Two engine quirks have to be neutralized for a CJS bundle to work standalone:
 *
 *   1. `import.meta.url` — the engine's ESM build resolves package-relative
 *      asset paths via `fileURLToPath(import.meta.url)`. In a CJS bundle that
 *      value is empty, so `fileURLToPath(undefined)` throws. We `define` it to
 *      a CJS-safe expression so the (graceful-fallback) template loaders don't
 *      crash before they can fall back.
 *
 *   2. Schema JSON files — `getValidator()` reads
 *      `skills/guide/schemas/<name>.schema.json` off disk at runtime. Those
 *      files don't ship with the CLI. We inline them into the bundle at build
 *      time via an esbuild onLoad transform, removing the filesystem read
 *      entirely. This is the load-bearing fix: audit/coverage/gate all validate
 *      their JSON output, so a missing schema = a hard tool error.
 */

const here = dirname(fileURLToPath(import.meta.url));

// Resolve the engine's schemas directory from the workspace sibling package.
const SCHEMAS_DIR = join(here, '..', 'vibe-test', 'skills', 'guide', 'schemas');

function loadEmbeddedSchemas(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const file of readdirSync(SCHEMAS_DIR)) {
    if (!file.endsWith('.schema.json')) continue;
    const name = file.replace(/\.schema\.json$/, '');
    out[name] = JSON.parse(readFileSync(join(SCHEMAS_DIR, file), 'utf8'));
  }
  return out;
}

const EMBEDDED_SCHEMAS = loadEmbeddedSchemas();

/**
 * esbuild plugin: inline the engine's JSON schemas into its bundled source so
 * the validator never touches the filesystem at runtime.
 */
const inlineEngineSchemas = {
  name: 'inline-engine-schemas',
  setup(build: {
    onLoad: (
      opts: { filter: RegExp },
      cb: (args: { path: string }) => { contents: string; loader: 'js' } | undefined,
    ) => void;
  }) {
    // Match the engine's built ESM entry (resolved from packages/vibe-test/dist).
    const filter = /vibe-test[\\/]dist[\\/]index\.js$/;
    build.onLoad({ filter }, (args) => {
      let code = readFileSync(args.path, 'utf8');

      // Replace the disk-reading getValidator body with an embedded-schema lookup.
      // The original block (post-tsup) reads:
      //   const filePath = join(schemasDir(), `${name}.schema.json`);
      //   const raw = readFileSync(filePath, "utf8");
      //   const schema = JSON.parse(raw);
      const needle =
        'const filePath = join(schemasDir(), `${name}.schema.json`);\n' +
        '  const raw = readFileSync(filePath, "utf8");\n' +
        '  const schema = JSON.parse(raw);';
      const replacement =
        'const __EMBEDDED_SCHEMAS__ = ' +
        JSON.stringify(EMBEDDED_SCHEMAS) +
        ';\n' +
        '  const schema = __EMBEDDED_SCHEMAS__[name];\n' +
        '  if (!schema) throw new Error(`schema-validators: no embedded schema for \'${name}\'`);';

      if (!code.includes(needle)) {
        throw new Error(
          'inline-engine-schemas: could not find the getValidator filesystem-read block in ' +
            'the engine dist. The engine build output shape changed — re-check ' +
            'packages/vibe-test/dist/index.js and update the needle in tsup.config.ts.',
        );
      }
      code = code.replace(needle, replacement);

      return { contents: code, loader: 'js' };
    });
  },
};

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  clean: true,
  // Bundle the engine + its entire transitive tree into the output. Nothing
  // @esthernandez/* (or its deps) survives as a runtime import.
  noExternal: [/.*/],
  // CJS-safe shim so the engine's `fileURLToPath(import.meta.url)` template
  // loaders don't throw. `fileURLToPath` requires a real file:// URL, so we
  // redirect `import.meta.url` to an injected identifier holding a proper file
  // URL of the bundle. esbuild `define` only accepts an entity name or literal
  // (not a call expression) — hence the inject + define pairing.
  // The path-walking asset loaders that consume this all have graceful
  // fallbacks when the resolved dir holds no asset files (which it won't —
  // schemas are inlined; templates fall back to embedded defaults).
  define: {
    'import.meta.url': 'IMPORT_META_URL_SHIM',
  },
  inject: ['./build/import-meta-url-shim.js'],
  esbuildPlugins: [inlineEngineSchemas],
  // src/index.ts already carries `#!/usr/bin/env node` on line 1; tsup hoists it
  // to the top of the bundle automatically. No banner needed (a banner would
  // produce a duplicate shebang).
  target: 'node20',
  platform: 'node',
} satisfies Options);
