import { defineCustomElements } from '@revolist/revogrid/loader';
import { AdvanceFilterPlugin } from '@revolist/revogrid-pro';
import '@revolist/revogrid-pro/dist/revogrid-pro.css';

defineCustomElements();

const grid = document.querySelector('#grid');
const debug = document.querySelector('#debug');
const runButton = document.querySelector('#run');
const resetButton = document.querySelector('#reset');

const allRows = Array.from({ length: 98 }, (_, index) => ({
  id: index + 1,
  address: index === 37
    ? 'Smolnaya Street'
    : index === 72
      ? 'Smolnaya Embankment'
      : `Example Avenue ${index + 1}`,
  district: index % 2 ? 'North' : 'Central',
}));

const events = [];
let requestNumber = 0;
let lastRequestedValue;

grid.columns = [
  { prop: 'id', name: 'ID', size: 70 },
  { prop: 'address', name: 'Address', size: 260, filter: true },
  { prop: 'district', name: 'District', size: 140, filter: true },
];
grid.filter = true;
grid.plugins = [AdvanceFilterPlugin];
grid.grouping = { props: ['district'], expandedAll: true };
grid.source = allRows.map(row => ({ ...row }));

for (const eventName of [
  'beforefilterapply',
  'beforefiltertrimmed',
  'afterfilterapply',
  'beforesourceset',
  'aftersourceset',
]) {
  grid.addEventListener(eventName, event => {
    events.push({ event: eventName, defaultPrevented: event.defaultPrevented });
    window.setTimeout(() => renderSnapshot(eventName));
  });
}

grid.addEventListener('beforefilterapply', event => {
  const value = event.detail?.collection?.address?.value ?? '';
  if (value === lastRequestedValue) return;
  lastRequestedValue = value;
  void reloadFromServer(value);
});

async function reloadFromServer(value) {
  const currentRequest = ++requestNumber;
  events.push({ event: 'server:start', request: currentRequest, value });
  await new Promise(resolve => window.setTimeout(resolve, 150));
  if (currentRequest !== requestNumber) return;

  const needle = String(value).toLocaleLowerCase();
  const rows = (needle
    ? allRows.filter(row => row.address.toLocaleLowerCase().includes(needle))
    : allRows
  ).map(row => ({ ...row }));

  events.push({ event: 'server:end', request: currentRequest, returned: rows.length });
  grid.source = rows;
  window.setTimeout(() => renderSnapshot('server source settled'));
}

runButton.addEventListener('click', () => {
  events.length = 0;
  lastRequestedValue = undefined;
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
  requestNumber += 1;
  events.length = 0;
  lastRequestedValue = '';
  const filterPlugin = (await grid.getPlugins()).find(plugin =>
    typeof plugin.clearFiltering === 'function'
  );
  await filterPlugin?.clearFiltering();
  grid.source = allRows.map(row => ({ ...row }));
  window.setTimeout(() => renderSnapshot('reset settled'));
});

async function renderSnapshot(phase = 'ready') {
  if (!grid.getSource) return;
  const source = await grid.getSource();
  const visible = await grid.getVisibleSource();
  const store = await grid.getSourceStore();

  debug.textContent = JSON.stringify({
    mode: 'AdvanceFilterPlugin; InfinityScrollPlugin disabled',
    phase,
    sourceRows: source.length,
    visibleRows: visible.length,
    emptySourceRows: source.filter(row => !Object.keys(row ?? {}).length).length,
    sourcePreview: source.slice(0, 5),
    visiblePreview: visible.slice(0, 5),
    events,
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
