// Vice Coast Cover Studio — the cover renderer. Everything it draws is its own:
// a sunset sky, a sun disc, procedural palm silhouettes, gradient-map grades,
// panel layouts and heavy gradient lettering, all on a 2D canvas. No external art.

export const GRADES = {
  sunset: { name: 'Sunset', filter: 'saturate(1.25) contrast(1.06) brightness(1.02)',
    wash: ['rgba(255,122,26,0.20)', 'rgba(214,40,120,0.34)'], sky: ['#2b1055', '#ff7b2f', '#ffd166'],
    title: ['#fff3b0', '#ff9e2c', '#ff2e63'], sub: '#ffd166' },
  neon: { name: 'Neon night', filter: 'saturate(1.45) contrast(1.12) brightness(0.96)',
    wash: ['rgba(255,0,128,0.26)', 'rgba(0,229,255,0.22)'], sky: ['#12002e', '#7b2ff7', '#ff2e88'],
    title: ['#ffffff', '#ff5edb', '#00e5ff'], sub: '#00e5ff' },
  gold: { name: 'Gold hour', filter: 'saturate(1.3) contrast(1.05) brightness(1.05)',
    wash: ['rgba(255,190,60,0.24)', 'rgba(180,90,0,0.26)'], sky: ['#3a1c00', '#ff9e2c', '#ffe66d'],
    title: ['#fffbe6', '#ffd166', '#ff7b2f'], sub: '#ffe66d' },
  teal: { name: 'Teal coast', filter: 'saturate(1.2) contrast(1.06) brightness(1.0)',
    wash: ['rgba(45,226,197,0.20)', 'rgba(10,80,140,0.30)'], sky: ['#062a3a', '#0e7c86', '#2de2c5'],
    title: ['#eafffb', '#2de2c5', '#0e7c86'], sub: '#2de2c5' },
  noir: { name: 'Noir', filter: 'grayscale(1) contrast(1.18) brightness(1.04)',
    wash: ['rgba(0,0,0,0.10)', 'rgba(255,255,255,0.06)'], sky: ['#0a0a0a', '#3a3a3a', '#c9c9c9'],
    title: ['#ffffff', '#e8e8e8', '#9a9a9a'], sub: '#e8e8e8' },
};

export const LAYOUTS = {
  grid4: { name: 'Four panels', panels: 4 },
  hero3: { name: 'Hero + three', panels: 4 },
  single: { name: 'One full photo', panels: 1 },
  tilt: { name: 'Tilted snapshots', panels: 3 },
};

/** Panel rectangles in unit space (0..1), plus a rotation in degrees. */
export function layoutPanels(layout, w, h) {
  const gap = 0.018;
  const titleH = layout === 'single' ? 0.30 : 0.26;
  const top = 0.155; // sky strip above the panels: the sun lives here
  const bottom = 1 - titleH - 0.015;
  const L = (x, y, pw, ph, rot = 0) => ({ x, y, w: pw, h: ph, rot });
  if (layout === 'grid4') {
    const pw = (1 - gap * 3) / 2, ph = (bottom - top - gap) / 2;
    return [L(gap, top, pw, ph), L(gap * 2 + pw, top, pw, ph),
      L(gap, top + ph + gap, pw, ph), L(gap * 2 + pw, top + ph + gap, pw, ph)];
  }
  if (layout === 'hero3') {
    const heroW = 0.60, sideX = gap * 2 + heroW, sideW = 1 - sideX - gap;
    const sh = (bottom - top - gap * 2) / 3;
    return [L(gap, top, heroW, bottom - top),
      L(sideX, top, sideW, sh), L(sideX, top + sh + gap, sideW, sh),
      L(sideX, top + (sh + gap) * 2, sideW, sh)];
  }
  if (layout === 'single') return [L(gap, top, 1 - gap * 2, bottom - top)];
  // tilt: one big snapshot leaning left, two smaller leaning right, overlapping the sky.
  const pw = 0.46, ph = (bottom - top) * 0.86;
  return [L(0.05, top + 0.01, pw, ph, -3.5),
    L(0.50, top, 0.44, ph * 0.62, 3), L(0.52, top + ph * 0.60, 0.42, ph * 0.44, -2)];
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draws one photo into a rect, cover-fit, with per-panel zoom and pan offsets. */
export function drawPhotoInto(ctx, img, r, px, py, pw, ph, zoom, ox, oy, filter) {
  if (!img) return;
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const scale = Math.max(pw / iw, ph / ih) * zoom;
  const dw = iw * scale, dh = ih * scale;
  // Clamp the pan so the photo always covers the panel: no sky gaps at the edges.
  const maxOx = Math.max(0, (dw - pw) / 2 / pw);
  const maxOy = Math.max(0, (dh - ph) / 2 / ph);
  const cx = Math.max(-maxOx, Math.min(maxOx, ox));
  const cy = Math.max(-maxOy, Math.min(maxOy, oy));
  const dx = px + (pw - dw) / 2 + cx * pw;
  const dy = py + (ph - dh) / 2 + cy * ph;
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  ctx.filter = filter || 'none';
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  ctx.restore();
}

/** A palm silhouette, drawn from bezier fronds — the app's own line art. */
export function drawPalm(ctx, x, y, s, flip, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -s : s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  // trunk: a gentle lean
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(14, -70, 34, -128);
  ctx.stroke();
  // fronds fanning from the crown, drooping like a real palm
  const crownX = 34, crownY = -128;
  for (let i = 0; i < 7; i++) {
    const a = (-172 + i * 26) * Math.PI / 180;
    const len = 66 - Math.abs(i - 3) * 8;
    const ex = crownX + Math.cos(a) * len;
    const ey = crownY + Math.sin(a) * len * 0.45 + 22;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(crownX + Math.cos(a) * len * 0.55, crownY - 18, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startSize, weight = 900) {
  let size = startSize;
  ctx.font = `${weight} ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  while (size > 14 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  }
  return size;
}

function drawTitleBlock(ctx, w, h, state, grade) {
  const title = (state.title || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim().toUpperCase();
  const zoneY = h * (state.layout === 'single' ? 0.70 : 0.74);
  const zoneH = h - zoneY;
  // dark band so the lettering reads on any photo
  const band = ctx.createLinearGradient(0, zoneY - h * 0.05, 0, h);
  band.addColorStop(0, 'rgba(16,6,32,0)');
  band.addColorStop(0.35, 'rgba(16,6,32,0.72)');
  band.addColorStop(1, 'rgba(16,6,32,0.88)');
  ctx.fillStyle = band;
  ctx.fillRect(0, zoneY - h * 0.05, w, h - zoneY + h * 0.05);
  // thin neon rule above the title
  ctx.fillStyle = grade.sub;
  ctx.fillRect(w * 0.06, zoneY - h * 0.012, w * 0.20, Math.max(3, h * 0.006));
  if (!title) return;
  const cx = w / 2;
  ctx.save();
  ctx.translate(cx, zoneY + zoneH * 0.44);
  ctx.rotate(-0.02);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const size = fitFont(ctx, title, w * 0.88, h * 0.115);
  const grad = ctx.createLinearGradient(0, -size * 0.55, 0, size * 0.55);
  const stops = state.titleStyle === 'white' ? ['#ffffff', '#ffffff', '#e8e8e8']
    : state.titleStyle === 'neon' ? ['#ffffff', '#ff5edb', '#ff2e88']
    : grade.title;
  grad.addColorStop(0, stops[0]);
  grad.addColorStop(0.55, stops[1]);
  grad.addColorStop(1, stops[2]);
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, size * 0.10);
  ctx.strokeStyle = 'rgba(20,4,36,0.95)';
  ctx.shadowColor = 'rgba(255,46,99,0.55)';
  ctx.shadowBlur = size * 0.28;
  ctx.strokeText(title, 0, 0);
  ctx.shadowBlur = 0;
  ctx.fillStyle = grad;
  ctx.fillText(title, 0, 0);
  ctx.restore();
  if (sub) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const subSize = Math.max(12, h * 0.028);
    ctx.font = `700 ${subSize}px "Arial Black", Arial, sans-serif`;
    try { ctx.letterSpacing = `${Math.max(2, subSize * 0.35)}px`; } catch (_) { /* older canvas */ }
    ctx.fillStyle = grade.sub;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = subSize * 0.3;
    ctx.fillText(sub, w / 2, zoneY + zoneH * 0.82);
    try { ctx.letterSpacing = '0px'; } catch (_) { /* older canvas */ }
    ctx.restore();
  }
}

function drawGrain(ctx, w, h, seed) {
  const rnd = mulberry32(seed);
  ctx.save();
  ctx.globalAlpha = 0.10;
  for (let i = 0; i < Math.floor(w * h / 2600); i++) {
    const v = Math.floor(rnd() * 255);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(rnd() * w, rnd() * h, 1.4, 1.4);
  }
  ctx.restore();
  // vignette
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(10,2,20,0.42)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}

/**
 * Renders the whole cover onto ctx at W x H.
 * state: { layout, grade, title, subtitle, titleStyle, grain, palms,
 *          photos: [Image|null], panels: [{photo, zoom, ox, oy}] }
 */
export function drawCover(ctx, W, H, state) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  const seed = 20261119;
  // sunset sky
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // sun disc with stripes, riding in the sky strip above the panels
  const sunR = Math.min(W, H) * 0.062;
  const sunX = W * 0.82, sunY = H * 0.078;
  const sun = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
  sun.addColorStop(0, '#fff3b0');
  sun.addColorStop(0.6, '#ffb347');
  sun.addColorStop(1, '#ff5e78');
  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = sun;
  ctx.fillRect(sunX - sunR, sunY - sunR, sunR * 2, sunR * 2);
  ctx.fillStyle = grade.sky[0];
  for (let i = 0; i < 4; i++) {
    const y = sunY + sunR * (0.05 + i * 0.22);
    ctx.fillRect(sunX - sunR, y, sunR * 2, sunR * 0.055);
  }
  ctx.restore();
  // horizon glow
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.6);
  glow.addColorStop(0, 'rgba(255,180,90,0.35)');
  glow.addColorStop(1, 'rgba(255,180,90,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // panels
  const rects = layoutPanels(state.layout, W, H);
  const border = Math.max(4, Math.min(W, H) * 0.008);
  rects.forEach((r, i) => {
    const p = state.panels[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const img = state.photos[p.photo] ?? state.photos[0] ?? null;
    const px = r.x * W, py = r.y * H, pw = r.w * W, ph = r.h * H;
    ctx.save();
    ctx.translate(px + pw / 2, py + ph / 2);
    ctx.rotate((r.rot || 0) * Math.PI / 180);
    ctx.translate(-pw / 2, -ph / 2);
    // snapshot white border + drop shadow
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = Math.min(W, H) * 0.03;
    ctx.shadowOffsetY = Math.min(W, H) * 0.012;
    ctx.fillStyle = '#fff8f0';
    ctx.fillRect(-border, -border, pw + border * 2, ph + border * 2);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    if (img) {
      drawPhotoInto(ctx, img, r, 0, 0, pw, ph, p.zoom || 1, p.ox || 0, p.oy || 0, grade.filter);
    } else {
      ctx.fillStyle = '#2b1838';
      ctx.fillRect(0, 0, pw, ph);
    }
    // grade wash over the photo
    const wash = ctx.createLinearGradient(0, 0, 0, ph);
    wash.addColorStop(0, grade.wash[0]);
    wash.addColorStop(1, grade.wash[1]);
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, pw, ph);
    ctx.restore();
  });

  // palm silhouettes framing the cover
  if (state.palms !== false) {
    const s = Math.min(W, H) / 620;
    ctx.globalAlpha = 0.92;
    drawPalm(ctx, W * 0.015, H * 0.985, s * 1.15, false, '#160a24');
    drawPalm(ctx, W * 0.985, H * 0.985, s * 0.9, true, '#160a24');
    ctx.globalAlpha = 1;
  }

  drawTitleBlock(ctx, W, H, state, grade);
  if (state.grain !== false) drawGrain(ctx, W, H, seed);
  // thin outer frame
  ctx.strokeStyle = 'rgba(255,209,102,0.9)';
  ctx.lineWidth = Math.max(3, Math.min(W, H) * 0.006);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
}
