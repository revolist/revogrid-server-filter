import { defineCustomElements } from '@revolist/revogrid/loader';
import {
  AdvanceFilterPlugin,
  InfinityScrollPlugin,
} from '@revolist/revogrid-pro';
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
let loadNumber = 0;

grid.columns = [
  { prop: 'id', name: 'ID', size: 70 },
  { prop: 'address', name: 'Address', size: 260, filter: true },
  { prop: 'district', name: 'District', size: 140, filter: true },
];
grid.filter = true;
grid.plugins = [InfinityScrollPlugin, AdvanceFilterPlugin];
grid.infinityScroll = {
  chunkSize: 20,
  bufferSize: 40,
  preloadThreshold: 0.75,
  total: allRows.length,
  loadData: async (skip, limit, order, singleFilters, multiFilters) => {
    const currentLoad = ++loadNumber;
    events.push({
      event: 'loadData:start',
      load: currentLoad,
      skip,
      limit,
      singleFilters,
      multiFilters,
    });
    await renderSnapshot('loading');
    await new Promise(resolve => window.setTimeout(resolve, 150));

    const filter = singleFilters?.address;
    const needle = String(filter?.value ?? '').toLocaleLowerCase();
    const filtered = needle
      ? allRows.filter(row => row.address.toLocaleLowerCase().includes(needle))
      : allRows;
    const data = filtered.slice(skip, skip + limit).map(row => ({ ...row }));

    events.push({
      event: 'loadData:end',
      load: currentLoad,
      returned: data.length,
      total: filtered.length,
    });
    window.setTimeout(() => renderSnapshot('settled'));
    return {
      data,
      total: filtered.length,
      hasMore: skip + data.length < filtered.length,
    };
  },
};

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
  events.length = 0;
  const filterPlugin = (await grid.getPlugins()).find(plugin =>
    typeof plugin.clearFiltering === 'function'
  );
  await filterPlugin?.clearFiltering();
  window.setTimeout(() => renderSnapshot('reset settled'), 200);
});

async function renderSnapshot(phase = 'ready') {
  if (!grid.getSource) return;
  const source = await grid.getSource();
  const visible = await grid.getVisibleSource();
  const store = await grid.getSourceStore();

  debug.textContent = JSON.stringify({
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
