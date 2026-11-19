// Vice Coast Cover Studio — wires the editor: photos in (local FileReader only,
// never uploaded), per-panel crop/position/zoom, layouts, grades, words, export.
import { drawCover, layoutPanels, GRADES, LAYOUTS } from './cover.js';
import { runShot } from './shots.js';

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
  '1080x1920': [1080, 1920],
};

export const state = {
  layout: 'hero3',
  grade: 'sunset',
  title: 'VICE COAST',
  subtitle: 'SUNSET BOULEVARD',
  titleStyle: 'sunset',
  grain: true,
  palms: true,
  size: '1080x1080',
  photos: [], // { img, name, url }
  panels: [
    { photo: 0, zoom: 1, ox: 0, oy: 0 },
    { photo: 1, zoom: 1, ox: 0, oy: 0 },
    { photo: 0, zoom: 1, ox: 0, oy: 0 },
    { photo: 1, zoom: 1, ox: 0, oy: 0 },
  ],
  selected: 0,
};

const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function renderState() {
  return {
    ...state,
    photos: state.photos.map((p) => p.img),
    panels: state.panels.slice(0, (LAYOUTS[state.layout] || {}).panels || 1),
  };
}

export function redraw() {
  if (state.shotW && state.shotH) {
    // Cover shot: draw at the exact pixels the screenshot asks for.
    canvas.width = state.shotW;
    canvas.height = state.shotH;
  } else {
    const [w, h] = SIZES[state.size] || SIZES['1080x1080'];
    const scale = Math.min(720 / w, 720 / h);
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
  }
  drawCover(ctx, canvas.width, canvas.height, renderState());
}

/** Renders the cover at full export size and resolves with the PNG blob. */
export function exportCover(sizeKey) {
  const [w, h] = SIZES[sizeKey || state.size];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off.getContext('2d'), w, h, renderState());
  return new Promise((resolve) => off.toBlob((blob) => resolve({ blob, w, h }), 'image/png'));
}

async function downloadExport() {
  const { blob, w, h } = await exportCover(state.size);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vice-coast-cover-${w}x${h}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  status.textContent = `Saved vice-coast-cover-${w}x${h}.png (${Math.round(blob.size / 1024)} KiB) — photos stayed on this machine.`;
}

// ---- photo tray ----
const tray = document.getElementById('tray');
const panelPhoto = document.getElementById('panelPhoto');

function refreshTray() {
  tray.innerHTML = '';
  if (!state.photos.length) {
    const d = document.createElement('div');
    d.className = 'empty';
    d.textContent = 'No photos yet — add one, or try a sample.';
    tray.appendChild(d);
  }
  state.photos.forEach((p, i) => {
    const img = document.createElement('img');
    img.src = p.url;
    img.alt = p.name;
    img.title = p.name;
    img.className = state.panels[state.selected]?.photo === i ? 'selected' : '';
    img.addEventListener('click', () => {
      state.panels[state.selected].photo = i;
      refreshTray();
      refreshPanelTools();
      redraw();
    });
    tray.appendChild(img);
  });
  panelPhoto.innerHTML = '';
  state.photos.forEach((p, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = `${i + 1} · ${p.name}`;
    panelPhoto.appendChild(o);
  });
  const sel = state.panels[state.selected];
  if (sel) panelPhoto.value = String(sel.photo);
}

function refreshPanelTools() {
  const sel = state.panels[state.selected];
  if (!sel) return;
  document.getElementById('zoom').value = String(sel.zoom);
  panelPhoto.value = String(sel.photo);
}

async function addPhotoFile(file) {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  state.photos.push({ img, name: file.name, url });
  refreshTray();
  redraw();
}

async function addSample(name, label) {
  const img = await loadImage(`samples/${name}.jpg`);
  state.photos.push({ img, name: label, url: `samples/${name}.jpg` });
  refreshTray();
  redraw();
}

document.getElementById('photo').addEventListener('change', async (e) => {
  for (const f of e.target.files) await addPhotoFile(f);
  e.target.value = '';
});
document.getElementById('samplePier').addEventListener('click', () => addSample('pier', 'Pier sample'));
document.getElementById('sampleBoulevard').addEventListener('click', () => addSample('boulevard', 'Boulevard sample'));
document.getElementById('fillAll').addEventListener('click', () => {
  const sel = state.panels[state.selected];
  if (!sel) return;
  state.panels.forEach((p) => { p.photo = sel.photo; });
  status.textContent = 'Every panel now uses the selected photo — drag each one to frame it differently.';
  redraw();
});
panelPhoto.addEventListener('change', () => {
  state.panels[state.selected].photo = Number(panelPhoto.value);
  refreshTray();
  redraw();
});
document.getElementById('zoom').addEventListener('input', (e) => {
  state.panels[state.selected].zoom = Number(e.target.value);
  redraw();
});
document.querySelectorAll('[data-nudge]').forEach((b) => {
  b.addEventListener('click', () => {
    const [dx, dy] = b.dataset.nudge.split(',').map(Number);
    const p = state.panels[state.selected];
    p.ox = Math.max(-0.5, Math.min(0.5, p.ox + dx));
    p.oy = Math.max(-0.5, Math.min(0.5, p.oy + dy));
    redraw();
  });
});
document.getElementById('recenter').addEventListener('click', () => {
  const p = state.panels[state.selected];
  p.ox = 0; p.oy = 0; p.zoom = 1;
  refreshPanelTools();
  redraw();
});

// ---- layout / grade / words / size ----
function markActive(container, attr, value) {
  container.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset[attr] === value));
}
document.getElementById('layouts').addEventListener('click', (e) => {
  const b = e.target.closest('[data-layout]');
  if (!b) return;
  state.layout = b.dataset.layout;
  state.selected = 0;
  markActive(document.getElementById('layouts'), 'layout', state.layout);
  refreshTray();
  refreshPanelTools();
  redraw();
});
document.getElementById('grades').addEventListener('click', (e) => {
  const b = e.target.closest('[data-grade]');
  if (!b) return;
  state.grade = b.dataset.grade;
  markActive(document.getElementById('grades'), 'grade', state.grade);
  redraw();
});
document.querySelectorAll('.size-chip').forEach((b) => {
  b.addEventListener('click', () => {
    state.size = b.dataset.size;
    document.querySelectorAll('.size-chip').forEach((x) => x.classList.toggle('active', x === b));
    redraw();
  });
});
document.getElementById('caption').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
document.getElementById('titleStyle').addEventListener('change', (e) => { state.titleStyle = e.target.value; redraw(); });
document.getElementById('grain').addEventListener('change', (e) => { state.grain = e.target.checked; redraw(); });
document.getElementById('palms').addEventListener('change', (e) => { state.palms = e.target.checked; redraw(); });
document.getElementById('export').addEventListener('click', downloadExport);
document.getElementById('exportTop').addEventListener('click', downloadExport);

// ---- preview interaction: click a panel to select, drag to pan, wheel to zoom ----
function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;
  const rects = layoutPanels(state.layout, 1, 1);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0) return;
  state.selected = i;
  refreshTray();
  refreshPanelTools();
  const p = state.panels[i];
  drag = { x: e.clientX, y: e.clientY, ox: p.ox, oy: p.oy, moved: false };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const p = state.panels[state.selected];
  p.ox = Math.max(-0.5, Math.min(0.5, drag.ox + (e.clientX - drag.x) / rect.width));
  p.oy = Math.max(-0.5, Math.min(0.5, drag.oy + (e.clientY - drag.y) / rect.height));
  drag.moved = true;
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0) return;
  e.preventDefault();
  const p = state.panels[i];
  p.zoom = Math.max(1, Math.min(2.5, p.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
  state.selected = i;
  refreshPanelTools();
  redraw();
}, { passive: false });
canvas.addEventListener('dragover', (e) => e.preventDefault());
canvas.addEventListener('drop', async (e) => {
  e.preventDefault();
  for (const f of e.dataTransfer.files) {
    if (f.type.startsWith('image/')) await addPhotoFile(f);
  }
});

// ---- boot ----
markActive(document.getElementById('layouts'), 'layout', state.layout);
markActive(document.getElementById('grades'), 'grade', state.grade);
document.querySelector('.size-chip[data-size="1080x1080"]').classList.add('active');

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  document.body.classList.add('shot-editor');
  await runShot(shot, query, {
    loadSample: addSample,
    setState(patch) { Object.assign(state, patch); },
    redraw,
    exportCover,
    loadImage,
  });
  if (query.get('selftest')) {
    const { blob, w, h } = await exportCover(state.size);
    document.getElementById('selftest').textContent = `SELFTEST_EXPORT_OK ${w}x${h} ${blob.size} bytes`;
    document.title = `SELFTEST_EXPORT_OK ${w}x${h} ${blob.size}`;
    window.__shotReady = true;
  }
} else {
  // First paint already shows art: load both free sample photos.
  await addSample('pier', 'Pier sample');
  await addSample('boulevard', 'Boulevard sample');
  if (query.get('selftest')) {
    const { blob, w, h } = await exportCover(state.size);
    document.getElementById('selftest').textContent = `SELFTEST_EXPORT_OK ${w}x${h} ${blob.size} bytes`;
    document.title = `SELFTEST_EXPORT_OK ${w}x${h} ${blob.size}`;
  }
  redraw();
}
