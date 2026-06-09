# Applied Changes

Audit log of `/vibe-test:evolve` proposals that have been accepted and applied. Each
entry preserves the original proposal (observation + diff + justification + evidence)
and records the commit that applied it. `proposed-changes.md` is working memory; this
file is the permanent audit trail.

All five entries below originate from the 2026-06-09 evolve run (session
`6b0d5b08-efdd-4833-abd4-41f17e325a1c`) and were applied the same day in the
`vibe-test` solo repo (`github.com/estevanhernandez-stack-ed/vibe-test`).

---

## Proposal 2026-06-09-01 — status: applied

- **Commit:** `94a7e461031dc9e9f569f3d8bc95c85164850084`
- **Applied at:** 2026-06-09
- **Files touched:** `packages/vibe-test/skills/vitals/SKILL.md`
- **Notes:** Applied verbatim from the ratified diff.

**Title:** Vitals Check #8 — release consistency (tag ↔ manifest)
**Command affected:** `vitals`
**Pattern weight:** 0.0 friction (repo evidence — verified, not log-derived)
**Baseline:** n/a (no vitals usage history)

### Observation

Tag `vibe-test-v0.2.4` ("first release from solo repo", commit `eaa1c7b`) shipped with
`.claude-plugin/plugin.json` reading `"version": "0.2.3"` — verified via
`git show vibe-test-v0.2.4:packages/vibe-test/.claude-plugin/plugin.json`. HEAD still
reads `0.2.3`. Downstream, `~/.claude/plugins/installed_plugins.json` reports the
installed copy as `0.2.3`, so every Pattern #15 resolution, banner, and session-log
entry reports the stale number for a v0.2.4 release. No vitals check covers
release-channel consistency, so the slip was structurally invisible to the plugin's
own self-test.

### Proposed diff

```diff
--- packages/vibe-test/skills/vitals/SKILL.md
+++ packages/vibe-test/skills/vitals/SKILL.md
@@ intro (line 12)
-This SKILL runs seven **read-only** checks against the installed plugin files, the unified profile, the session/friction/wins logs, and the anchored composition registry.
+This SKILL runs eight **read-only** checks against the installed plugin files, the unified profile, the session/friction/wins logs, the anchored composition registry, and the release tag history.
@@ heading (line 55)
-## The Seven Checks
+## The Eight Checks
@@ after Check #7 body (line 114), before "Vitals never writes"
 - ✗ fail: parse error OR required-field violation OR schema_version mismatch unreconcilable by migration.

+### Check #8 — Release consistency (tag ↔ manifest)
+
+Runs only when the plugin root sits inside a git work tree with `vibe-test-v*` tags
+reachable; skips silently in installed-cache contexts. Read `.claude-plugin/plugin.json`
+`version`; read the highest `vibe-test-v<semver>` tag; compare.
+
+- ✓ pass: manifest version equals the highest release tag's version.
+- ⚠ warn: manifest version is ahead of the highest tag (release staged, not yet tagged — normal mid-promotion).
+- ✗ fail: highest tag is ahead of the manifest — a tag shipped without the version bump; every banner, session-log entry, and Pattern #15 resolution downstream reports the stale number.
+
 Vitals never writes; it reports. The caller (`/evolve` in v0.2) decides whether to offer remediation.
@@ summary (line 143)
-The seven counts sum to 7.
+The eight counts sum to 8.
```

### Justification

The exact failure already shipped once and is still live at HEAD. The check is one
version-string comparison at the precise moment vitals already runs (evolve pre-flight,
v0.3 slash command), and the warn/fail asymmetry distinguishes the normal
mid-promotion state from the shipped-slip state. Marketplace promotion flow
(`vibe-plugins` ref bumps) trusts tags; this makes the tag trustworthy.

### Evidence

- repo: `git show vibe-test-v0.2.4:packages/vibe-test/.claude-plugin/plugin.json` → `"version": "0.2.3"` (verified 2026-06-09)
- repo: HEAD `packages/vibe-test/.claude-plugin/plugin.json` → `"version": "0.2.3"`
- repo: `~/.claude/plugins/installed_plugins.json` → `plugins/vibe-test@vibe-plugins` version `0.2.3`

```json
{"proposal_id":"2026-06-09-01","status":"applied","observation":"v0.2.4 tag shipped with plugin.json at 0.2.3; no vitals check covers release consistency","pattern_count":0,"pattern_weight":0.0,"baseline_clean_runs":0,"baseline_wins":0,"command_affected":"vitals","proposed_skill_edit":{"file":"packages/vibe-test/skills/vitals/SKILL.md","diff":"add Check #8 release consistency; seven->eight mentions"},"justification":"guard the canary->stable promotion path at the surface that already runs pre-flight","evidence_refs":[{"source":"repo","ref":"vibe-test-v0.2.4:plugin.json","timestamp":"2026-06-09"}],"applied_commit":"94a7e461031dc9e9f569f3d8bc95c85164850084"}
```

---

## Proposal 2026-06-09-02 — status: applied

- **Commit:** `56bc15fb826bdf53bcaf4ac472e5936a681c6916`
- **Applied at:** 2026-06-09
- **Files touched:** `packages/vibe-test/skills/evolve/SKILL.md`
- **Notes:** Applied verbatim from the ratified diff.

**Title:** Evolve prerequisite — verify the solo repo by remote identity, not "the monorepo"
**Command affected:** `evolve`
**Pattern weight:** 0.0 friction (structural evidence + one documented prior incident)
**Baseline:** n/a (first evolve run)

### Observation

`skills/evolve/SKILL.md` line 21 still gates on being "inside the Vibe Plugins
monorepo," but vibe-test has lived in its solo repo since the extraction (tag lineage
`vibe-test-v0.2.x`). Two lookalike targets exist on this machine alone: a non-repo
scratch dir at `~/Projects/vibe-test` (holds `framework.md` + `process-notes.md`
seeds) and an archived `drafts/vibe-test/proposed-changes.md` in the vibe-plugins
marketplace repo. The 2026-05-22 external review documented the failure mode in the
monorepo era: evolve's write target vanished mid-refactor and the paper trail had to
land in `drafts/` as a workaround. "A `packages/vibe-test/` is reachable" is not the
same claim as "this is the repo whose paper trail I should extend."

### Proposed diff

```diff
--- packages/vibe-test/skills/evolve/SKILL.md
+++ packages/vibe-test/skills/evolve/SKILL.md
@@ Prerequisites (line 21)
-- **Blocking:** the builder must be invoking this from inside the Vibe Plugins monorepo (`packages/vibe-test/` reachable from cwd). If not: refuse — the SKILL writes to `packages/vibe-test/proposed-changes.md`, which requires the repo context.
+- **Blocking:** the builder must be invoking this from inside the **vibe-test solo repo**. Verify BOTH before any write: (1) `git config --get remote.origin.url` resolves to `estevanhernandez-stack-ed/vibe-test` (any URL form, with or without `.git`), and (2) `packages/vibe-test/skills/evolve/SKILL.md` exists under the resolved repo root. If either fails: refuse and name which check failed. Lookalike directories exist — a non-repo scratch dir named `vibe-test`, and an archived `drafts/vibe-test/proposed-changes.md` in the vibe-plugins marketplace repo. Never write proposals into a directory that merely looks the part.
@@ Session Logging (line 33)
-At command start, call `session-logger.start("evolve", <repo-root>)` (the vibe-plugins root, resolved from the SKILL's own file location).
+At command start, call `session-logger.start("evolve", <repo-root>)` (the solo repo root, resolved from the SKILL's own file location).
```

### Justification

The paper trail (`proposed-changes.md` / `applied-changes.md`) is the product of this
command; writing it into a scratch dir or a stale archive silently forks the history.
Remote-identity verification is one git command, costs nothing, and turns the
documented 2026-05-22 failure mode into a refusal with a reason. This run performed
the remote check manually before writing — the diff just makes the SKILL demand it.

### Evidence

- repo: `skills/evolve/SKILL.md:21` ("Vibe Plugins monorepo") and `:33` ("the vibe-plugins root")
- archive: `vibe-plugins/drafts/vibe-test/proposed-changes.md` § "Meta-observation" (2026-05-22) — evolve write target orphaned post-refactor
- filesystem: `~/Projects/vibe-test` contains `docs/`, `framework.md`, `process-notes.md`; no `.git` (verified 2026-06-09)

```json
{"proposal_id":"2026-06-09-02","status":"applied","observation":"evolve prereq names the retired monorepo; lookalike dirs make wrong-target writes a live hazard","pattern_count":0,"pattern_weight":0.0,"baseline_clean_runs":0,"baseline_wins":0,"command_affected":"evolve","proposed_skill_edit":{"file":"packages/vibe-test/skills/evolve/SKILL.md","diff":"prereq 2 -> remote-identity + structure check; line 33 monorepo wording"},"justification":"protect the paper trail from forking into scratch/archive dirs","evidence_refs":[{"source":"drafts-archive","ref":"vibe-plugins/drafts/vibe-test/proposed-changes.md","timestamp":"2026-05-22"}],"applied_commit":"56bc15fb826bdf53bcaf4ac472e5936a681c6916"}
```

---

## Proposal 2026-06-09-03 — status: applied

- **Commit:** `ad4aa4d77d2b29aad4ed1e03f4ce62d86ff99d50`
- **Applied at:** 2026-06-09
- **Files touched:** `packages/vibe-test/skills/evolve/SKILL.md`
- **Notes:** Applied verbatim from the ratified diff (Step 2 insertion).

**Title:** Evolve input hygiene — smoke-entry filter + defined stale-window behavior
**Command affected:** `evolve`
**Pattern weight:** 0.3 friction channel (1 low entry — itself the contamination exhibit)
**Baseline:** 0 clean runs, 1 win (both synthetic)

### Observation

This run's entire input set — 1 friction, 1 win, 1 session — is one synthetic smoke
run from 2026-04-17 (`project: smoke-SMOKE-1776464458363`). Step 2 neither excludes
smoke/CI self-test entries from weighting nor defines what to do when the 30-day
window is empty while older entries exist: the prerequisite passes on "at least one
session-log entry exists," then the analysis meets zero in-window signal and the agent
must improvise (this run widened to all-time under builder instruction). Left as-is, a
future run with mixed real + smoke data silently counts synthetic signal toward
thresholds and Pattern #14 baselines in both directions.

### Proposed diff

```diff
--- packages/vibe-test/skills/evolve/SKILL.md
+++ packages/vibe-test/skills/evolve/SKILL.md
@@ Step 2, after input list (line 66)
 3. `~/.claude/plugins/data/vibe-test/sessions/*.jsonl` — session logs.

+**Synthetic-entry filter:** before weighting, exclude entries from smoke/CI self-tests —
+any entry whose `project` matches `^smoke-` or whose `symptom` embeds a `SMOKE-<digits>`
+marker. Count exclusions and show them in the summary banner. Smoke entries validate
+plumbing, not builder experience; they must not feed weights or baselines on either side.
+
+**Stale-window guard:** if zero entries survive inside the 30-day window but older
+entries exist, do not improvise. State exactly that, then offer:
+
+```
+  No Vibe Test signal in the last 30 days (newest entry: <date>).
+  [Widen to all-time — weights flagged stale]  [Abort]
+```
+
+A widened run labels every pattern weight and baseline as stale-window in
+`proposed-changes.md` and the banner.
+
 Then read every SKILL file in `packages/vibe-test/skills/**/SKILL.md` so your proposed diffs quote exact current text.
```

### Justification

Both branches fired on the very first real evolve run — 100% of available signal was
synthetic and 100% of it was out-of-window. The fix is two paragraphs of defined
behavior at the exact point the ambiguity bites, keeps the conservative default
(abort), and preserves the append-only logs (filtering at read time, never deleting).

### Evidence

- friction.jsonl: `9afbfb77-9219-4b91-8802-9de3857f5fad` @ `2026-04-17T22:20:58.369Z` — `classification_mismatch` / `low`, project `smoke-SMOKE-1776464458363`
- wins.jsonl: `9afbfb77-9219-4b91-8802-9de3857f5fad` @ `2026-04-17T22:20:58.371Z` — `dogfood_finding_reproduced`, `working_as_designed: true`, same smoke marker
- sessions/2026-04-17.jsonl: same UUID, sentinel + terminal pair, `key_decisions: ["marker=SMOKE-1776464458363"]`
- this run: window 2026-05-10 → 2026-06-09 contains zero entries; newest signal 53 days old

```json
{"proposal_id":"2026-06-09-03","status":"applied","observation":"all available signal is synthetic smoke data and predates the 30-day window; Step 2 defines neither exclusion nor empty-window behavior","pattern_count":1,"pattern_weight":0.3,"baseline_clean_runs":0,"baseline_wins":1,"command_affected":"evolve","proposed_skill_edit":{"file":"packages/vibe-test/skills/evolve/SKILL.md","diff":"Step 2: synthetic-entry filter + stale-window guard"},"justification":"both undefined branches fired on the first real evolve run","evidence_refs":[{"source":"friction.jsonl","sessionUUID":"9afbfb77-9219-4b91-8802-9de3857f5fad","timestamp":"2026-04-17T22:20:58.369Z"}],"applied_commit":"ad4aa4d77d2b29aad4ed1e03f4ce62d86ff99d50"}
```

---

## Proposal 2026-06-09-04 — status: applied

- **Commit:** `0e89a8d1e9442909a5091f325ecf72003006fb09`
- **Applied at:** 2026-06-09
- **Files touched:** `packages/vibe-test/skills/fix/SKILL.md`, `packages/vibe-test/skills/gate/SKILL.md`, `packages/vibe-test/skills/posture/SKILL.md`, `packages/vibe-test/skills/coverage/SKILL.md`
- **Notes:** All four Friction Logging tables realigned to their `friction-triggers.md` sections (types + confidences; gate/coverage `complement_rejected` corrected high → medium per the map). Applied one step past the proposal's table-only diff: two body-prose emissions of the same orphan types — `gate` Step 2a (`default_tier_applied`) and `fix` Step 6 defer-path (`complex_diagnosis_deferred`) — were also removed, since leaving them would ship a table that contradicts its own SKILL body. The map has no row for either trigger, so the aligned behavior is not to log; surrounding behavior (banner warning, deferral) is preserved. Out of scope and left as-is: the identical drift living only in `generate`'s map-row coverage (not an orphan invocation; warn-direction only).

**Title:** Re-align fix/gate/posture/coverage Friction Logging tables to the canonical trigger map
**Command affected:** `fix` (concrete diff), `gate`, `posture`, `coverage` (enumerated)
**Pattern weight:** 0.0 friction (structural — vitals check #6 ✗, cross-command)
**Baseline:** n/a (no real usage of any affected command logged)

### Observation

Vitals check #6 fails: 8 friction-type invocations across four command SKILL tables
name types that exist in neither `friction-triggers.md` nor the `FrictionType` union
(`src/state/friction-log.ts:18-34`):

- `fix`: `fix_rejected`, `complex_diagnosis_deferred`, `recurring_failure` (and
  `artifact_rewritten`, a valid type the map assigns to *generate*, not fix)
- `gate`: `default_tier_applied`, `verdict_overridden`
- `posture`: `suggestion_ignored`, `state_corruption`
- `coverage`: `cherry_picked_denominator`

In the other direction, map rows are missing from SKILL tables (generate:
`runtime_hook_failure`, `composition_deferral_confusion`, `default_overridden`; fix:
`default_overridden`, `harness_break`, `generation_pattern_mismatch`; gate:
`tier_threshold_dispute`, `runtime_hook_failure`; posture: `runtime_hook_failure`,
`sequence_revised`; coverage: `tier_threshold_dispute`). An agent following the SKILL
tables emits entries `/evolve`'s aggregation can't weight against the calibrated map.
The map matches the code; the SKILL tables are the drifted side.

### Proposed diff

Concrete diff for the worst offender (4 of 5 rows wrong); apply the same
map-alignment to gate/posture/coverage in the same commit.

```diff
--- packages/vibe-test/skills/fix/SKILL.md
+++ packages/vibe-test/skills/fix/SKILL.md
@@ Friction Logging (lines 259-265)
 | Trigger | friction_type | confidence |
 |---------|---------------|------------|
-| Rollback hook fires (auto-written test reverted) | `artifact_rewritten` | `high` |
-| Builder rejects a staged fix with a reason | `fix_rejected` | `medium` |
-| Complex diagnosis deferred to systematic-debugging | `complex_diagnosis_deferred` | `medium` |
-| Builder declines a Pattern #13 complement offer | `complement_rejected` | `high` |
-| Repeated same-failure runs across sessions (>=3) | `recurring_failure` | `low` |
+| Builder overrides fix's proposed remediation and picks a manual patch (quote both fixes in `symptom`) | `default_overridden` | `medium` |
+| Fix flags a harness-level break (F2) the builder says is intentional | `harness_break` | `medium` |
+| Builder declines a Pattern #13 complement offer (set `complement_involved`) | `complement_rejected` | `high` |
+| Auto-written test rollback leaves the suite worse than before fix was invoked | `generation_pattern_mismatch` | `high` |
```

### Justification

`friction-triggers.md` declares itself "source of truth" and agrees with the
`FrictionType` union — so alignment runs SKILL → map, the only direction evolve may
propose (the alternative, extending the union with the 8 new types, touches `src/`
and the load-bearing map: a human-designed PR, plus a vitals #6 re-run, if the
builder decides the richer types earn their place). Until aligned, the four tables
generate signal that poisons the exact weighting this command runs on.

### Evidence

- repo: `src/state/friction-log.ts:18-34` — canonical 16-type union
- repo: `skills/fix/SKILL.md:259-265`, `skills/gate/SKILL.md` + `skills/posture/SKILL.md` + `skills/coverage/SKILL.md` Friction Logging tables vs `skills/guide/references/friction-triggers.md` per-command sections
- vitals: check #6 ✗ this run (session `ebffaeee-38b2-42e0-9294-bc680cd42843` @ 2026-06-09)

```json
{"proposal_id":"2026-06-09-04","status":"applied","observation":"8 non-canonical friction types across 4 command SKILL tables; map rows unmirrored in 5 commands","pattern_count":0,"pattern_weight":0.0,"baseline_clean_runs":0,"baseline_wins":0,"command_affected":"fix","proposed_skill_edit":{"file":"packages/vibe-test/skills/fix/SKILL.md","diff":"replace friction table with map-aligned rows; same treatment for gate/posture/coverage"},"justification":"SKILL-emitted types outside the union cannot be weighted by evolve; map+code agree, SKILLs drifted","evidence_refs":[{"source":"vitals","sessionUUID":"ebffaeee-38b2-42e0-9294-bc680cd42843","timestamp":"2026-06-09"}],"applied_commit":"0e89a8d1e9442909a5091f325ecf72003006fb09"}
```

---

## Proposal 2026-06-09-05 — status: applied

- **Commit:** `db0d35f0581ecc1edfcfc486416fa85594a6468c`
- **Applied at:** 2026-06-09
- **Files touched:** `packages/vibe-test/skills/vitals/SKILL.md`, `packages/vibe-test/skills/guide/SKILL.md`, `packages/vibe-test/skills/evolve/SKILL.md`
- **Notes:** Main row corrected; both enumerated sibling fixes applied. For the framework-doc references the "point at canonical home" option was taken (over vendoring), targeting the vibe-cartographer repo. Scoped exactly to the three SKILLs the proposal enumerates (evolve/vitals/guide); the identical `docs/self-evolving-plugins-framework.md` reference also lives in `decay`/`friction-logger`/`wins-logger`/`session-logger` and was left untouched (outside the proposal's enumeration; these are not vitals check #1 failures since check #1 only resolves `skills/*/SKILL.md` paths).

**Title:** Vitals Runtime Paths — point command files at where they actually live
**Command affected:** `vitals`
**Pattern weight:** 0.0 friction (structural)
**Baseline:** n/a

### Observation

The vitals Runtime Paths table reads command files from
`packages/vibe-test/.claude-plugin/commands/*.md`. On disk, `.claude-plugin/` holds
only `plugin.json` + `active-path.json`; the eight command files live at
`packages/vibe-test/commands/*.md`. A future vitals implementation following its own
table would scan an empty path and either report phantom failures or silently skip
command-file checks.

### Proposed diff

```diff
--- packages/vibe-test/skills/vitals/SKILL.md
+++ packages/vibe-test/skills/vitals/SKILL.md
@@ Runtime Paths table (line 44)
-| Command files | `packages/vibe-test/.claude-plugin/commands/*.md` |
+| Command files | `packages/vibe-test/commands/*.md` |
```

### Justification

One-row correction to the self-test's own map of the world. Two sibling stale-path
mentions belong in the same cleanup commit (both in allowed SKILL files, enumerated
here to keep one proposal per concern):

- `skills/guide/SKILL.md:72` — "Read `framework.md` (monorepo root)": the file lives
  at `packages/vibe-test/framework.md` in the solo repo.
- `docs/self-evolving-plugins-framework.md` references in evolve/vitals/guide prose:
  the solo repo's `docs/` holds only `dogfood-wseyatm-v0.2.md`. Either vendor the
  framework doc or point at its canonical home in the vibe-cartographer repo.

### Evidence

- repo: `ls packages/vibe-test/.claude-plugin/` → `active-path.json`, `plugin.json` only (verified 2026-06-09)
- repo: `packages/vibe-test/commands/` → 8 command `.md` files
- repo: `skills/vitals/SKILL.md:44`; `skills/guide/SKILL.md:72`; `packages/vibe-test/docs/` listing

```json
{"proposal_id":"2026-06-09-05","status":"applied","observation":"vitals Runtime Paths row names .claude-plugin/commands/, actual location is commands/","pattern_count":0,"pattern_weight":0.0,"baseline_clean_runs":0,"baseline_wins":0,"command_affected":"vitals","proposed_skill_edit":{"file":"packages/vibe-test/skills/vitals/SKILL.md","diff":"Runtime Paths command-files row correction","justification":"self-test must map the world it actually checks"},"evidence_refs":[{"source":"repo","ref":"packages/vibe-test/.claude-plugin/ listing","timestamp":"2026-06-09"}],"applied_commit":"db0d35f0581ecc1edfcfc486416fa85594a6468c"}
```

---
