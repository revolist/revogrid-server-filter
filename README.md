# RevoGrid filter/source reproduction

Minimal Core 4.27.5 reproduction for replacing `grid.source` while a local
filter and row grouping are active.

```bash
pnpm install
pnpm dev
```

Open the printed URL and click **Run scenario**. The panel shows the filter and
source lifecycle, complete source objects, visible rows, physical indexes, and
all active trim layers.

The example deliberately does not call `preventDefault()` in
`beforefilterapply`, matching the reported hybrid setup.
