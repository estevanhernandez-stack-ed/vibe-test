# Vibe Test

> *"Catches the broken harnesses every other test tool assumes away."*

A Claude Code plugin and CLI that **reads a vibe-coded application, classifies it by maturity and risk, and generates the tests it actually needs** — not a dump of boilerplate, and not a pass/fail coverage meter. The report doubles as a teaching surface.

## Repo structure

This is the **Vibe Test solo repo** — the canary / edge-release channel. Two npm packages live here as a pnpm workspace:

- **`packages/vibe-test/`** — the Claude Code plugin (`@esthernandez/vibe-test`). SKILL files, commands, `src/` for deterministic primitives, schemas, templates.
- **`packages/vibe-test-cli/`** — the deterministic CLI (`@esthernandez/vibe-test-cli`) for CI / automation. v0.2 commands: `audit`, `coverage`, `gate`, `posture`.

## Install channels

**Canary — for beta testers.** Paste this repo's URL in Claude Code's *Add Marketplace* dialog:

```
estevanhernandez-stack-ed/vibe-test
```

This tracks the `main` branch of this repo. You see bleeding-edge work the moment it's pushed. Faster feedback loop; occasional breakage.

**Stable — for everyone else.** Install via the aggregated 626Labs marketplace:

```
estevanhernandez-stack-ed/vibe-plugins
```

That marketplace pins this plugin to a specific stable tag (e.g., `v0.2.4`). You see new releases only when they're explicitly promoted.

**CLI via npm:**

```bash
npm install -g @esthernandez/vibe-test-cli
vibe-test audit --help
```

## Development

```bash
pnpm install        # installs deps across both packages
pnpm build          # builds both packages
pnpm type-check     # runs tsc --noEmit across both
pnpm test           # runs vitest across both
```

Requires Node 20+ and pnpm 9+.

## Promotion to stable

The monorepo marketplace (`vibe-plugins`) pins to tags. To promote a canary release to stable:

1. Work lands on this repo's `main`
2. Tag a release: `git tag vX.Y.Z && git push --tags`
3. Update the `ref` field for `vibe-test` in `vibe-plugins/.claude-plugin/marketplace.json`
4. Commit + push the monorepo

Stable-channel users see the change after step 4.

## Links

- **Thesis + framework:** [`packages/vibe-test/framework.md`](./packages/vibe-test/framework.md)
- **Full documentation:** [`packages/vibe-test/docs/`](./packages/vibe-test/docs/)
- **CHANGELOG:** [`packages/vibe-test/CHANGELOG.md`](./packages/vibe-test/CHANGELOG.md)
- **626Labs:** https://626labs.dev

## License

MIT — © 626Labs LLC
