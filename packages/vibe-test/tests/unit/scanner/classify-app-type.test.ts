/**
 * classify-app-type — rule-matrix tests.
 *
 * v0.3.0 (GAP-20 + GAP-13 Tier 1) coverage:
 *  - claude-code-plugin via the .claude-plugin first-match rule (incl. the
 *    plugin-that-also-ships-a-CLI shape — plugin wins, CLI noted in reason)
 *  - cli-tool via package.json bin and via CLI-framework deps
 *  - library via entry points without surface
 *  - unsupported-stack honest decline: foreign markers with no package.json,
 *    and foreign markers dominating a token JS manifest
 *  - the pre-v0.3 absurdity pinned: a plugin/CLI repo must NEVER classify
 *    as "static" again
 *  - existing web rules unshadowed: full-stack-db / spa-api / spa / static
 *    still win their shapes
 */
import { describe, it, expect } from 'vitest';

import { classifyAppType } from '../../../src/scanner/classify-app-type.js';
import {
  detectFrameworksPure,
  type ForeignStack,
  type PackageJsonShape,
} from '../../../src/scanner/framework-detector.js';

function classify(
  pkg: PackageJsonShape | null,
  extras: { pluginManifests?: string[]; foreignStacks?: ForeignStack[] } = {},
  configFiles: string[] = [],
) {
  return classifyAppType({ detection: detectFrameworksPure(pkg, configFiles, extras) });
}

describe('honest decline — unsupported-stack (GAP-13 Tier 1)', () => {
  it('.NET repo with no package.json declines, never "static"', () => {
    const r = classify(null, { foreignStacks: ['dotnet'] });
    expect(r.app_type).toBe('unsupported-stack');
    expect(r.reason).toContain('dotnet');
    expect(r.reason).toContain('no scanner');
  });

  it('Python pipeline with a token JS manifest still declines', () => {
    // The POD_Pipeline shape: 55+ .py files, package.json carrying only a
    // formatter devDep. Scoring the JS sliver would imply the app was assessed.
    const r = classify(
      { name: 'pipeline', devDependencies: { prettier: '^3.0.0' } },
      { foreignStacks: ['python'] },
    );
    expect(r.app_type).toBe('unsupported-stack');
    expect(r.reason).toContain('python');
  });

  it('a real JS app with an incidental foreign marker is NOT declined', () => {
    // e.g. a Next.js app with a requirements.txt for a side script — the JS
    // framework signals win.
    const r = classify(
      {
        name: 'app',
        dependencies: { next: '14.0.0', react: '18.0.0', firebase: '10.0.0' },
      },
      { foreignStacks: ['python'] },
    );
    expect(r.app_type).toBe('full-stack-db');
  });

  it('multiple foreign stacks are all named in the reason', () => {
    const r = classify(null, { foreignStacks: ['dotnet', 'luau'] });
    expect(r.app_type).toBe('unsupported-stack');
    expect(r.reason).toContain('dotnet');
    expect(r.reason).toContain('luau');
  });
});

describe('claude-code-plugin — the .claude-plugin first-match rule (GAP-20)', () => {
  it('root manifest classifies as claude-code-plugin', () => {
    const r = classify(
      { name: 'vibe-something', devDependencies: { vitest: '^1.0.0' } },
      { pluginManifests: ['.claude-plugin/plugin.json'] },
    );
    expect(r.app_type).toBe('claude-code-plugin');
    expect(r.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('monorepo manifest under packages/ classifies (the Vibe-Doc shape)', () => {
    const r = classify(
      { name: 'vibe-doc-workspace' },
      { pluginManifests: ['packages/vibe-doc/.claude-plugin/plugin.json'] },
    );
    expect(r.app_type).toBe('claude-code-plugin');
    expect(r.reason).toContain('packages/vibe-doc/.claude-plugin/plugin.json');
  });

  it('plugin that also ships a CLI: plugin wins, bin noted in the reason', () => {
    const r = classify(
      {
        name: '@esthernandez/vibe-doc-cli',
        bin: { 'vibe-doc': './dist/index.js' },
        main: './dist/index.js',
      } as PackageJsonShape,
      { pluginManifests: ['.claude-plugin/plugin.json'] },
    );
    expect(r.app_type).toBe('claude-code-plugin');
    expect(r.reason).toContain('vibe-doc');
    expect(r.reason).toContain('CLI');
  });

  it('denominator semantics are stated in the reason (schemas + scripts + skills)', () => {
    const r = classify({ name: 'p' }, { pluginManifests: ['.claude-plugin/plugin.json'] });
    expect(r.reason).toMatch(/schemas \+ scripts \+ skill contracts/);
  });
});

describe('cli-tool (GAP-20)', () => {
  it('bin entry with no web surface classifies as cli-tool', () => {
    const r = classify({
      name: 'my-tool',
      bin: { 'my-tool': './dist/cli.js' },
    } as PackageJsonShape);
    expect(r.app_type).toBe('cli-tool');
    expect(r.reason).toContain('my-tool');
  });

  it('string-form bin works too', () => {
    const r = classify({ name: 'tool', bin: './cli.js' } as PackageJsonShape);
    expect(r.app_type).toBe('cli-tool');
  });

  it('CLI framework dep without bin classifies at lower confidence', () => {
    const r = classify({ name: 't', dependencies: { commander: '^11.0.0' } });
    expect(r.app_type).toBe('cli-tool');
    expect(r.confidence).toBeLessThan(0.9);
  });

  it('a CLI that is really an API service stays api-service (express wins)', () => {
    const r = classify({
      name: 'svc',
      bin: { svc: './cli.js' },
      dependencies: { express: '^4.0.0' },
    } as PackageJsonShape);
    expect(r.app_type).toBe('api-service');
  });
});

describe('library (GAP-20)', () => {
  it('entry points with no surface and no bin classify as library', () => {
    const r = classify({
      name: 'lib',
      main: './dist/index.js',
      types: './dist/index.d.ts',
    } as PackageJsonShape);
    expect(r.app_type).toBe('library');
    expect(r.reason).toContain('main');
  });

  it('bin beats library when both are present', () => {
    const r = classify({
      name: 'both',
      main: './dist/index.js',
      bin: { both: './dist/cli.js' },
    } as PackageJsonShape);
    expect(r.app_type).toBe('cli-tool');
  });
});

describe('the pre-v0.3 absurdity, pinned', () => {
  it('a plugin repo never again classifies as static', () => {
    const r = classify(
      { name: 'plugin', devDependencies: { vitest: '^1.0.0' } },
      { pluginManifests: ['.claude-plugin/plugin.json'] },
    );
    expect(r.app_type).not.toBe('static');
  });

  it('a .NET repo never again classifies as static', () => {
    const r = classify(null, { foreignStacks: ['dotnet'] });
    expect(r.app_type).not.toBe('static');
  });
});

describe('existing web rules are unshadowed', () => {
  it('frontend + database → full-stack-db', () => {
    const r = classify({
      name: 'app',
      dependencies: { react: '18', 'react-dom': '18', firebase: '10' },
    });
    expect(r.app_type).toBe('full-stack-db');
  });

  it('frontend + backend → spa-api', () => {
    const r = classify({
      name: 'app',
      dependencies: { react: '18', express: '4' },
    });
    expect(r.app_type).toBe('spa-api');
  });

  it('frontend only → spa', () => {
    const r = classify({ name: 'app', dependencies: { react: '18' } });
    expect(r.app_type).toBe('spa');
  });

  it('nothing at all → static (the genuine fallback survives)', () => {
    const r = classify({ name: 'plain' });
    expect(r.app_type).toBe('static');
  });
});
