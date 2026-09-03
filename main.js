import { defineCustomElements } from '@revolist/revogrid/loader';

defineCustomElements();

const grid = document.querySelector('#grid');
const debug = document.querySelector('#debug');
const runButton = document.querySelector('#run');
const resetButton = document.querySelector('#reset');

const initialRows = [
  { id: 1, address: 'Nevsky Avenue', district: 'Central' },
  { id: 2, address: 'Smolnaya Street', district: 'Central' },
  { id: 3, address: 'Liteyny Avenue', district: 'Central' },
  { id: 4, address: 'Smolnaya Embankment', district: 'Central' },
];

const serverRows = initialRows.filter(row => row.address.includes('Smolnaya'));
const events = [];
let installingServerRows = false;
let resetting = false;
let requestId = 0;

grid.columns = [
  { prop: 'id', name: 'ID', size: 70 },
  { prop: 'address', name: 'Address', size: 260, filter: true },
  { prop: 'district', name: 'District', size: 140 },
];
grid.filter = true;
grid.grouping = { props: ['district'], expandedAll: true };
grid.source = initialRows.map(row => ({ ...row }));

for (const eventName of [
  'beforefilterapply',
  'beforefiltertrimmed',
  'afterfilterapply',
  'beforesourceset',
  'aftersourceset',
]) {
  grid.addEventListener(eventName, () => events.push(eventName));
}

grid.addEventListener('beforefilterapply', () => {
  // Do not cancel local filtering: this intentionally reproduces the user's
  // hybrid configuration (server data plus the local filter plugin).
  if (installingServerRows || resetting) return;

  const currentRequest = ++requestId;
  window.setTimeout(() => {
    if (currentRequest !== requestId) return;

    installingServerRows = true;
    grid.source = serverRows.map(row => ({ ...row }));
    installingServerRows = false;
    window.setTimeout(renderSnapshot);
  }, 100);
});

runButton.addEventListener('click', () => {
  events.length = 0;
  grid.dispatchEvent(new CustomEvent('filter', {
    detail: {
      address: [
        {
          id: 0,
          type: 'contains',
          value: 'Smolnaya',
          relation: 'and',
        },
      ],
    },
  }));
});

resetButton.addEventListener('click', async () => {
  requestId += 1;
  events.length = 0;
  resetting = true;
  try {
    const filterPlugin = (await grid.getPlugins()).find(plugin =>
      typeof plugin.clearFiltering === 'function'
    );
    await filterPlugin?.clearFiltering();
    grid.source = initialRows.map(row => ({ ...row }));
  } finally {
    resetting = false;
  }
  await renderSnapshot();
});

async function renderSnapshot() {
  const source = await grid.getSource();
  const visible = await grid.getVisibleSource();
  const store = await grid.getSourceStore();

  debug.textContent = JSON.stringify({
    events,
    source,
    visible,
    sourceKeyCounts: source.map(row => Object.keys(row ?? {}).length),
    visibleKeyCounts: visible.map(row => Object.keys(row ?? {}).length),
    items: store.get('items'),
    proxyItems: store.get('proxyItems'),
    trimmed: store.get('trimmed'),
  }, null, 2);
}

async function initialize() {
  await customElements.whenDefined('revo-grid');
  await grid.componentOnReady();
  await renderSnapshot();
}

void initialize();
