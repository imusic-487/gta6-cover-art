// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample photo
// loaded; ?shot=cover shows the exported cover alone, drawn by the app itself at
// the size the query asks for. window.__shotReady is set once painted.
// `photo` picks the sample (samples/<photo>.jpg), `caption` the title words,
// `layout`, `grade`, `size` and `subtitle` pick the rest; `w` and `h` set the
// canvas pixels for the cover shot.
export async function runShot(shot, query, api) {
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const w = Number(query.get('w') || 1280);
    const h = Number(query.get('h') || 720);
    api.setState({
      shotW: w,
      shotH: h,
      layout: query.get('layout') || 'hero3',
      grade: query.get('grade') || 'sunset',
      title: query.get('caption') || 'VICE COAST',
      subtitle: query.get('subtitle') || 'SUNSET BOULEVARD',
      titleStyle: query.get('titleStyle') || 'sunset',
      size: query.get('size') || '1920x1080',
    });
    await api.loadSample(query.get('photo') || 'pier', (query.get('photo') || 'pier') === 'pier' ? 'Pier sample' : 'Boulevard sample');
    // One photo filling several panels reads flat if every panel shows the
    // same crop: frame each panel on a different part of it. The framing is
    // per layout, because a short wide strip and a squarish panel cut a photo
    // differently — positive oy shows the top of a photo, where faces are.
    const layout = query.get('layout') || 'hero3';
    const framesByLayout = {
      hero3: [
        { photo: 0, zoom: 1.05, ox: 0, oy: 0.1 },
        { photo: 0, zoom: 1.6, ox: 0.25, oy: 0.6 },
        { photo: 0, zoom: 1.6, ox: -0.25, oy: 0.3 },
        { photo: 0, zoom: 1.6, ox: 0, oy: -0.6 },
      ],
      grid4: [
        { photo: 0, zoom: 1.0, ox: -0.06, oy: 0.3 },
        { photo: 0, zoom: 1.15, ox: 0.06, oy: 0.3 },
        { photo: 0, zoom: 1.0, ox: 0.04, oy: 0.3 },
        { photo: 0, zoom: 1.2, ox: -0.04, oy: 0.25 },
      ],
      tilt: [
        { photo: 0, zoom: 1.05, ox: 0, oy: 0.1 },
        { photo: 0, zoom: 1.2, ox: 0.15, oy: 0.15 },
        { photo: 0, zoom: 1.25, ox: -0.1, oy: -0.05 },
      ],
      single: [{ photo: 0, zoom: 1.05, ox: 0, oy: 0.08 }],
    };
    api.setState({ panels: framesByLayout[layout] || framesByLayout.hero3 });
    api.redraw();
  } else {
    // editor scene: one sample photo loaded, hero layout, ready to frame.
    api.setState({
      layout: query.get('layout') || 'hero3',
      grade: query.get('grade') || 'sunset',
      title: query.get('caption') || 'VICE COAST',
      subtitle: query.get('subtitle') || 'SUNSET BOULEVARD',
      size: query.get('size') || '1080x1080',
    });
    await api.loadSample(query.get('photo') || 'boulevard', 'Boulevard sample');
    // Load the other sample too, so the panels alternate between two photos.
    const other = (query.get('photo') || 'boulevard') === 'pier' ? 'boulevard' : 'pier';
    await api.loadSample(other, other === 'pier' ? 'Pier sample' : 'Boulevard sample');
    api.redraw();
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
