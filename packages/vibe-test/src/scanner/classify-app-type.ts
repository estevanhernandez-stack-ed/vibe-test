/**
 * Classify app type — deterministic rule match over `DetectionResult`.
 *
 * Called by the audit SKILL at Step 2 (classification). App type is the
 * deterministic half of the classifier; tier is the fuzzy half and lives in
 * the SKILL prompt (per Spec Decision 1 — agent-heavy split).
 *
 * Rule order matters — the first matching rule wins. Rules are ordered from
 * most-specific to least-specific so `multi-tenant-saas` doesn't get shadowed
 * by `full-stack-db`.
 *
 * Maps from `spec.md > Component Areas > Audit (Classifier sub-flow)`,
 * extended in v0.3.0 (GAP-20 + GAP-13 Tier 1):
 *   no package.json + foreign markers     → unsupported-stack (honest decline)
 *   .claude-plugin/plugin.json anywhere   → claude-code-plugin
 *   multi-tenant signals                  → multi-tenant-saas
 *   react+firebase-firestore+fns          → full-stack-db
 *   react+express                         → spa-api
 *   express+fastify+no-frontend           → api-service
 *   react+vite+no-backend                 → spa
 *   package.json bin / CLI framework      → cli-tool
 *   entry points, no surface, no bin      → library
 *   foreign markers dominate              → unsupported-stack
 *   else                                  → static
 */
import type { DetectionResult } from './framework-detector.js';
import { hasCliFrameworkDep } from './framework-detector.js';
import type { AppType } from '../state/project-state.js';
import type { ModelEntry } from './model-inventory.js';
import type { RouteEntry } from './route-inventory.js';

export interface ClassifyAppTypeInput {
  detection: DetectionResult;
  /** Optional: routes the scanner found. Used for "has backend routes" signals. */
  routes?: RouteEntry[];
  /** Optional: models extracted. Used for multi-tenant heuristics. */
  models?: ModelEntry[];
  /** Optional: component count — used to decide frontend presence. */
  componentCount?: number;
}

export interface ClassifyAppTypeResult {
  app_type: AppType;
  /** Short string explaining the winning rule — renders in markdown + banner. */
  reason: string;
  /** Confidence for this app-type call, 0..1. Tier confidence is computed separately. */
  confidence: number;
}

/** Convenience — "has X" predicates against the detection result. */
function hasFrontend(det: DetectionResult): boolean {
  return det.frontend.length > 0;
}
function hasBackend(det: DetectionResult): boolean {
  return det.backend.length > 0;
}
function hasDatabase(det: DetectionResult): boolean {
  return det.database.length > 0;
}
function hasAuth(det: DetectionResult): boolean {
  return det.auth.length > 0;
}

function hasMultiTenantSignals(input: ClassifyAppTypeInput): boolean {
  // Heuristic #1: auth provider present + userId plumbing in models.
  if (!hasAuth(input.detection)) return false;
  const models = input.models ?? [];
  const userIdModels = models.filter((m) =>
    m.fields.some((f) => /^user_?id$|^tenant_?id$|^org_?id$/i.test(f.name)),
  );
  if (userIdModels.length >= 2) return true;
  // Heuristic #2: Prisma multi-schema marker — textual. We can't tell from the
  // framework detector alone; defer to future scanner signal.
  // Heuristic #3: Multiple Firestore "collections with userId" — approximated
  // via Zod/Joi models with userId.
  return false;
}

export function classifyAppType(input: ClassifyAppTypeInput): ClassifyAppTypeResult {
  const det = input.detection;
  const frontend = hasFrontend(det);
  const backend = hasBackend(det);
  const database = hasDatabase(det);
  const routeCount = input.routes?.length ?? 0;
  const foreignStacks = det.foreignStacks ?? [];
  const pluginManifests = det.pluginManifests ?? [];
  const binEntries = det.binEntries ?? {};
  const binNames = Object.keys(binEntries);
  const libraryEntrySignals = det.libraryEntrySignals ?? [];

  // Rule D — Honest decline (GAP-13 Tier 1). A repo with foreign-stack
  // project markers and no JS/TS manifest has NOTHING the scanner can
  // assess. "static" here would imply the stack was assessed and found
  // empty — a silent zero-source no-op that reads as coverage. Out of
  // scope is a declaration, not a score.
  if (foreignStacks.length > 0 && !det.packageJson) {
    return {
      app_type: 'unsupported-stack',
      reason:
        `Detected ${foreignStacks.join(' + ')} project markers and no JS/TS ` +
        `package manifest — Vibe Test has no scanner for this stack. ` +
        `Declining honestly: no coverage claim, no score, gate cannot assess.`,
      confidence: 0.9,
    };
  }

  // Rule P — Claude Code plugin (the .claude-plugin first-match rule).
  // A plugin's testable surface is schemas + scripts + skill contracts,
  // not routes/pages — the denominator the matrix assigns this type.
  if (pluginManifests.length > 0) {
    const cliNote =
      binNames.length > 0 ? `; also ships a CLI (bin: ${binNames.join(', ')})` : '';
    return {
      app_type: 'claude-code-plugin',
      reason:
        `Claude Code plugin manifest found (${pluginManifests.join(', ')})${cliNote}. ` +
        `Denominator: schemas + scripts + skill contracts, not routes.`,
      confidence: 0.95,
    };
  }

  // Rule 0 — Multi-tenant SaaS (most specific).
  if (hasMultiTenantSignals(input) && frontend && (backend || database)) {
    return {
      app_type: 'multi-tenant-saas',
      reason:
        'Frontend + backend/db + auth provider + userId/tenantId plumbing detected across multiple models',
      confidence: 0.85,
    };
  }

  // Rule 1 — Full-stack with database.
  // Either (a) detected frontend + database, or (b) frontend + Firebase functions + firestore.
  if (frontend && database) {
    return {
      app_type: 'full-stack-db',
      reason: `Frontend (${det.frontend.join('+')}) + database (${det.database.join('+')}) detected`,
      confidence: 0.9,
    };
  }

  // Rule 2 — SPA + API (frontend + backend but no database signals).
  if (frontend && (backend || routeCount > 0)) {
    const backendLabel = backend ? det.backend.join('+') : `${routeCount} route(s)`;
    return {
      app_type: 'spa-api',
      reason: `Frontend (${det.frontend.join('+')}) + backend (${backendLabel})`,
      confidence: 0.9,
    };
  }

  // Rule 3 — API service (backend without frontend).
  if (!frontend && (backend || routeCount > 0)) {
    return {
      app_type: 'api-service',
      reason: `Backend only (${det.backend.join('+') || `${routeCount} route(s)`}), no frontend detected`,
      confidence: 0.9,
    };
  }

  // Rule 4 — SPA (frontend without backend).
  if (frontend && !backend && routeCount === 0) {
    return {
      app_type: 'spa',
      reason: `Client-only SPA (${det.frontend.join('+')}), no API surface detected`,
      confidence: 0.9,
    };
  }

  // Rule C — CLI tool: a bin entry (or a recognized CLI framework) with no
  // web surface. Denominator: command handlers + exit-code contract paths,
  // not pages.
  const cliFramework = hasCliFrameworkDep(det.allDependencies ?? {});
  if (binNames.length > 0 || cliFramework) {
    const signal =
      binNames.length > 0
        ? `package.json bin (${binNames.join(', ')})`
        : 'CLI framework dependency';
    return {
      app_type: 'cli-tool',
      reason: `${signal}, no web surface detected. Denominator: command handlers + exit-code contract.`,
      confidence: binNames.length > 0 ? 0.9 : 0.75,
    };
  }

  // Rule L — Library: entry points published, no UI, no server, no bin.
  // Denominator: the exported public API surface.
  if (libraryEntrySignals.length > 0) {
    return {
      app_type: 'library',
      reason:
        `package.json entry points (${libraryEntrySignals.join(', ')}) with no ` +
        `frontend/backend/bin — consumed as a library. Denominator: exported public API.`,
      confidence: 0.8,
    };
  }

  // Rule D2 — Foreign stack dominates a token JS manifest (e.g. a Python
  // pipeline repo carrying only a prettier devDep). Same honest decline.
  if (foreignStacks.length > 0) {
    return {
      app_type: 'unsupported-stack',
      reason:
        `A JS/TS manifest exists but carries no framework signals, while ` +
        `${foreignStacks.join(' + ')} project markers are present — the dominant ` +
        `stack has no Vibe Test scanner. Declining honestly rather than scoring ` +
        `the JS sliver as if it were the app.`,
      confidence: 0.8,
    };
  }

  // Rule 5 — Static fallback.
  return {
    app_type: 'static',
    reason: 'No framework signals detected — treating as static site',
    confidence: 0.6,
  };
}
