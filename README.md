<p align="center">
  <img alt="Vibe Test — honest coverage for vibe-coded apps" src="https://626labs.dev/assets/brand/plugins/vibe-test-banner-1500x500.png" />
</p>

# Vibe Test

**Reads a vibe-coded app, classifies it by maturity and risk, and generates the tests it actually needs — and catches the broken harnesses every other test tool assumes away.**

[![stable](https://img.shields.io/github/v/tag/estevanhernandez-stack-ed/vibe-test?label=stable&color=17d4fa)](https://github.com/estevanhernandez-stack-ed/vibe-test/tags)

## What it does

Vibe-coded apps don't fail because they lack tests — they fail because nobody told the AI what "correct" means beyond "it runs." Vibe Test reads the application that exists, infers what correct means from the code's own behavior, and generates tests proportional to the app's maturity and deployment risk. The report doubles as a teaching surface — not a dump of boilerplate, and not a pass/fail coverage meter.

- **Classifies your app by type and maturity tier.** A static site, an SPA, a full-stack app with a database, and a multi-tenant SaaS need different test levels. The classifier reads your routes, components, data models, and integrations, then tells you which levels your app needs — not what's missing for 100% coverage, what's missing for *your* situation.
- **Generates tests proportional to deployment risk.** Smoke (does it even start?), behavioral (does it do what it should?), edge case (does it survive the unexpected?), and integration (do the pieces fit?) — prioritized by the tier the classifier assigns, so a prototype doesn't get over-tested and a payment API doesn't get under-tested.
- **Measures coverage honestly — no cherry-picked denominators.** It uses `c8 --all` to count every source file, not just the ones a test happens to touch. A backend that reports 88% but only measures 3 of 43 files is really at ~6%, and Vibe Test says so.
- **Catches the broken harnesses every other test tool assumes away.** A vitest forks-pool timeout that silently reports a false 0%. A `package.json` script that calls a binary nobody installed. A coverage command quietly scoped to a handful of files. These are detected and remediated as a first-class capability, not a happy accident.

## How it works

Two npm packages live in this repo as a pnpm workspace:

- **`packages/vibe-test/`** — the Claude Code plugin (`@esthernandez/vibe-test`). The classification prose, generation reasoning, and reporter narrative live in SKILL files (the agent layer); deterministic primitives — AST walk, `c8` shell-out, harness detection, state I/O, CLI parsing — live in `src/`. That agent-heavy split keeps classification fresh as models improve and keeps self-evolution cheap.
- **`packages/vibe-test-cli/`** — the deterministic CLI (`@esthernandez/vibe-test-cli`) for CI and automation. Ships `audit`, `coverage`, `gate`, and `posture` — no LLM, no API key, just reproducible pass/fail and reports for your pipeline.

The plugin surface adds `generate` and `fix` on top, where the LLM does the work the deterministic CLI can't. State is layered: a builder testing profile and session memory under `~/.claude/plugins/data/vibe-test/`, and per-project test state under `<project>/.vibe-test/`.

## Validated on

WeSeeYouAtTheMovies — three real findings reproduced live on the real codebase: a broken `test:coverage` command (vitest forks-pool timeout returning a false 0%), a backend script referencing an uninstalled binary, and a coverage report scoped to 3 of 43 source files (the cherry-picked denominator). Real-app validation is the bar, not the exception.

## Install

**Stable (recommended) — as a Claude Code plugin via the marketplace:**

```text
/plugin marketplace add estevanhernandez-stack-ed/vibe-plugins
/plugin install vibe-test@vibe-plugins
```

**Canary — track this repo's `main`:**

```text
/plugin install vibe-test@estevanhernandez-stack-ed/vibe-test
```

**CLI via npm (CI / automation, no plugin needed):**

```bash
npm install -g @esthernandez/vibe-test-cli

vibe-test audit --cwd .   # scan, classify, write the report
vibe-test gate --ci       # audit + coverage + threshold check; exit 0 pass, 1 breach, 2 tool error
```

## Development

```bash
pnpm install      # installs deps across both packages
pnpm build        # builds both packages
pnpm type-check   # runs tsc --noEmit across both
pnpm test         # runs vitest across both
```

Requires Node 20+ and pnpm 9+.

## Promotion to stable

The aggregated marketplace (`vibe-plugins`) pins this plugin to a tag. To promote a canary release to stable:

1. Work lands on this repo's `main`.
2. Tag a release (this plugin uses the `vibe-test-vX.Y.Z` tag form) and push the tag.
3. Update the `ref` field for `vibe-test` in `vibe-plugins/.claude-plugin/marketplace.json`.
4. Commit and push the marketplace repo.

Stable-channel users see the change after step 4.

## Links

- **Thesis + framework:** [`packages/vibe-test/framework.md`](./packages/vibe-test/framework.md)
- **Full documentation:** [`packages/vibe-test/docs/`](./packages/vibe-test/docs/)
- **CHANGELOG:** [`packages/vibe-test/CHANGELOG.md`](./packages/vibe-test/CHANGELOG.md)

## Part of the Vibe ecosystem

One of 11 plugins in the **[Vibe Plugins](https://github.com/estevanhernandez-stack-ed/vibe-plugins)** marketplace from [626 Labs](https://626labs.dev) — foundations (Thesis Engine, Keystone) and process pillars (Cartographer, Doc, Sec, Test, Thesis, Iterate, Taker, Walk, Insights) for AI-assisted creation.

```text
/plugin marketplace add estevanhernandez-stack-ed/vibe-plugins
```

## License

MIT — *Imagine Something Else.*
