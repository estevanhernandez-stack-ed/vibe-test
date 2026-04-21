# Changelog

All notable changes to `@esthernandez/vibe-test-cli` will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.4] — 2026-04-19 · First release from solo repo

No functional code changes — this release exists to mark the migration from the `vibe-plugins` monorepo into the dedicated solo repo at `github.com/estevanhernandez-stack-ed/vibe-test`.

### Changed

- `repository.url` now points at the solo repo (`vibe-test`) instead of the monorepo (`vibe-plugins`)
- `homepage` and `bugs` URLs updated to the new solo repo
- Workspace dependency on `@esthernandez/vibe-test` resolves via pnpm workspace at the solo-repo root

## [0.2.3] and earlier

See the pre-migration git history at `github.com/estevanhernandez-stack-ed/vibe-plugins` — commits prior to `0eb2179` (the solo-repo scaffolding commit). Versions `0.2.0` through `0.2.3` shipped from the monorepo following the vibe-test package's version cadence.

### v0.2.0–v0.2.3 feature set

- `vibe-test audit` — scanner + classifier + reporter, emits all three output views (markdown / banner / JSON)
- `vibe-test coverage` — honest-denominator coverage measurement via c8 or the detected framework
- `vibe-test gate --ci` — tier-threshold pass/fail with GitHub Actions annotations, exit codes 0 (pass) / 1 (threshold breach) / 2 (tool error)
- `vibe-test posture` — read-only ambient summary of current test posture
- `vibe-test generate` and `vibe-test fix` — plugin-only in v0.2 (require LLM reasoning); exit 2 with a clear message pointing builders at the Claude Code plugin invocation. Headless versions land in v0.3 with `ANTHROPIC_API_KEY`.
