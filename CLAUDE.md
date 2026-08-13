## Agent skills

### Issue tracker

Issues live as GitHub Issues (uses the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five canonical labels (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Stack

TypeScript on Node.js. `npm run check` runs typecheck + the full test suite (vitest). Packages live under `src/packages/<name>/` as deep modules (entry point + `lib/` + `tests/`) — see [src/packages/README.md](src/packages/README.md) before adding or importing one.
