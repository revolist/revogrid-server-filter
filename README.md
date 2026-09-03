# RevoGrid Pro remote-filter reproduction

Minimal reproduction using exactly:

- `@revolist/revogrid` 4.27.5
- `@revolist/revogrid-pro` 2.5.7
- `InfinityScrollPlugin`
- `AdvanceFilterPlugin`

The demo uses a delayed in-memory `loadData` function as a fake server. Click
**Run scenario** to apply `contains "Smolnaya"`. Infinity Scroll intercepts the
filter event, prevents Core local trimming, and reloads the remote source.

During the artificial 150 ms request, unloaded rows are `{}` placeholders by
design. The debug panel labels this as `loading`. Once the request settles, the
two matching rows must contain all three fields and `emptySourceRows` must be
zero.

## Install

RevoGrid Pro is distributed through the private GitHub Packages registry. Make
sure your npm configuration can access `@revolist/revogrid-pro`, then run:

```bash
pnpm install
pnpm dev
```

Click **Reset** to clear the advanced filter. The plugin triggers another
remote load, restores a 98-row virtual source, and loads its first 20-row
chunk. The other rows remain `{}` placeholders until their chunks are loaded.

Client-side grouping is intentionally absent: Pro 2.5.7 disables Infinity
Scroll when Core grouping is active because a partial remote source cannot be
grouped locally. A grouped remote reproduction must use the separate
server-side grouping plugin.
