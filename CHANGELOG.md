# Vibe Test Workspace — Changelog

This is the workspace-level changelog. Per-package changelogs live at:

- [`packages/vibe-test/CHANGELOG.md`](./packages/vibe-test/CHANGELOG.md) — plugin changes
- [`packages/vibe-test-cli/CHANGELOG.md`](./packages/vibe-test-cli/CHANGELOG.md) — CLI changes (TBD)

## 2026-04-19 — Solo repo extracted from monorepo

Vibe Test moved from `github.com/estevanhernandez-stack-ed/vibe-plugins/packages/vibe-test*` into its own solo repo to support canary / stable two-channel releases.

- Full commit history preserved via `git filter-repo` (19 commits + 4 tags: `vibe-test-v0.2.0` through `vibe-test-v0.2.3`)
- Workspace root added (`package.json`, `pnpm-workspace.yaml`, `.gitignore`, `.claude-plugin/marketplace.json` for canary channel)
- npm packages (`@esthernandez/vibe-test`, `@esthernandez/vibe-test-cli`) `repository` field updates in v0.2.4+

For versions prior to this date see `packages/vibe-test/CHANGELOG.md` and the git history.
