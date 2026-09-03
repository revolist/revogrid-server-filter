# RevoGrid Pro filter/source reproduction

Minimal reproduction using exactly:

- `@revolist/revogrid` 4.27.5
- `@revolist/revogrid-pro` 2.5.7
- `AdvanceFilterPlugin`
- client-side grouping
- `InfinityScrollPlugin` disabled

The demo follows the reported hybrid setup: `beforefilterapply` starts a fake
server request, while the advanced filter still performs local filtering. When
the request finishes, the handler replaces `grid.source` with the complete
server-filtered rows.

Click **Run scenario** to apply `contains "Smolnaya"`. The debug panel records
the filtering and source lifecycle and reports how many source rows are empty
objects. Click **Reset** to clear the filter and restore all 98 rows.

## Install

RevoGrid Pro is distributed through the private GitHub Packages registry. Copy
`.npmrc.example` to `.npmrc`, provide a token with package access, then run:

```bash
pnpm install
pnpm dev
```
