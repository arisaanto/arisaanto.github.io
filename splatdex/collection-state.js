const key = 'splatdex-collection-v1';
let state = { removed: [], added: [], order: {}, edits: {}, catalogs: [], catalogByFile: {} };
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved && Array.isArray(saved.removed) && saved.order && saved.edits) state = { ...state, ...saved };
} catch {}

// Retire names left by the reconstruction trials; preserve deliberate edits.
for (const [file, edit] of Object.entries(state.edits)) {
  if (file === 'banded-rock' && ['Bandit Rock','Banded rock','Portuguese Rock','Portuguese rock'].includes(edit.name)) delete edit.name;
}

export const wasRemoved = file => state.removed.includes(file);
const starterSplats = new Set(['clove', 'cardamom', 'pepper', 'strawberry']);
export const isSaved = item => !wasRemoved(item.file)
  && (item.personal || starterSplats.has(item.file) || state.added.includes(item.file));
export const customCatalogs = () => state.catalogs;
export const personalCategory = item => state.catalogByFile[item.file] ?? item.category ?? 'spices';
export const edited = item => isSaved(item) ? { ...item, ...state.edits[item.file] } : item;

function commit(next) {
  localStorage.setItem(key, JSON.stringify(next));
  state = next;
}

export function createCatalog(name, id = `custom-${crypto.randomUUID()}`) {
  const catalog = { id, name };
  commit({ ...state, catalogs: [...state.catalogs, catalog] });
  return catalog;
}

export function assignCatalog(file, category, orderedFiles) {
  const order = Object.fromEntries(Object.entries(state.order).map(([id, files]) => [
    id, files.filter(entry => entry !== file)
  ]));
  order[category] = [...orderedFiles.filter(entry => entry !== file), file];
  commit({ ...state, order, catalogByFile: { ...state.catalogByFile, [file]: category } });
}

export function setSaved(file, saved) {
  const removed = state.removed.filter(value => value !== file);
  if (!saved) removed.push(file);
  const added = state.added.filter(value => value !== file);
  if (saved) added.push(file);
  commit({ ...state, removed, added });
}

export function saveEdits(file, edits) {
  commit({ ...state, edits: { ...state.edits, [file]: { ...state.edits[file], ...edits } } });
}

export function collectionOrder(category, entries) {
  const files = state.order[category] ?? [];
  const remaining = new Map(entries.map(entry => [entry.file, entry]));
  const ordered = [];
  for (const file of files) {
    if (remaining.has(file)) ordered.push(remaining.get(file));
    remaining.delete(file);
  }
  return [...ordered, ...remaining.values()].filter(isSaved);
}

export function moveEntry(category, all, file, next) {
  const visible = collectionOrder(category, all).map(entry => entry.file);
  const index = visible.indexOf(file);
  if (index < 0 || index === next || next < 0 || next >= visible.length) return;
  visible.splice(index, 1);
  visible.splice(next, 0, file);
  const previous = state.order[category] ?? all.map(entry => entry.file);
  const known = new Set(visible);
  let cursor = 0;
  const merged = [...previous, ...all.map(entry => entry.file).filter(entry => !previous.includes(entry))]
    .map(entry => known.has(entry) ? visible[cursor++] : entry);
  commit({ ...state, order: { ...state.order, [category]: merged } });
}
