# Packages

Each package under `src/packages/<name>/` is a deep module:

```
src/packages/
  <name>/
    index.ts   ← public entry point. Import this from outside the package.
    lib/       ← implementation detail, hidden from outside.
    tests/     ← tests + fixtures, importing only ../index (never ../lib/*).
```

Import a package only through its entry point (`index.ts`), never through `lib/`. This is what lets a package's internals change freely as long as its entry point's behavior stays the same.

External services (Google Drive, Gmail, Calendar, …) are accessed through a narrow interface defined in the consuming package's `lib/` (e.g. `kpi-storage/lib/drive-client.ts`), injected rather than constructed internally. Tests exercise that interface with an in-memory fake — never the real API.
