# Branch Guide

This repo now has three meaningful branches.

## `main`
Docs / strategy / proof notes / product direction.

Use this for:
- product docs
- proof notes
- decision logs
- partner-track strategy

Do not assume `main` contains the active app runtime.

## `frontend/truth-pass`
Raw Replit export branch.

This branch exists as a historical handoff / provenance branch. It includes Replit workspace structure and extra scaffolding that we do not want to treat as the final repo shape.

Use this for:
- reference
- provenance
- comparing what originally came from Replit

Do not treat this as the active engineering branch.

## `integration/truth-pass-clean`
Active engineering integration branch.

This is the cleaned repo-first branch where:
- root keeps docs/proof work
- app runtime lives under `app/`
- obvious Replit junk was pruned
- local typecheck/build was validated
- truth-pass frontend is now integrated into the repo in a usable shape

Use this branch for current implementation work.

## Current rule
- Repo source of truth = `integration/truth-pass-clean` for app work
- Repo source of truth = `main` for older docs history unless/until merged
- Replit should be used only for narrow scoped tasks, not broad repo drift
