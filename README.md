# Vice Coast Cover Studio

[![make.fun bounty](https://img.shields.io/badge/make.fun-gta6--cover--art--01-ff2e63)](https://make.fun/bounty/gta6-cover-art-01)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Offline](https://img.shields.io/badge/offline-no%20upload-2de2c5)](app/index.html)

An offline web app that turns your photo and one line of words into a
multi-panel sunset cover in the style of a GTA-style poster — and exports it
as a PNG to share. Made for the make.fun bounty
[Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01) ($250, top 50).

## What it does

- **Any photo** — add your own photos from your machine (read with FileReader,
  never uploaded) or try the two built-in samples. Fill several panels with one
  photo or several.
- **Crop & position each panel** — click a panel to select it, drag the photo
  inside it, scroll to zoom, or use the nudge buttons and zoom slider.
- **Four layouts** — four panels, hero + three, one full photo, tilted snapshots.
- **Five colour grades** — Sunset, Neon night, Gold hour, Teal coast, Noir —
  plus film grain, vignette and procedural palm silhouettes.
- **Words** — editable title and subtitle, three title styles, heavy gradient
  lettering drawn on canvas.
- **Fast export** — one click to a PNG in 1080 × 1080, 1080 × 1350,
  1920 × 1080 or 1080 × 1920 (story).

## Run it (offline, no build step)

```sh
node serve.ts
# open http://localhost:8080
```

or open `app/index.html` from any static file server. It makes zero network
requests: every script, image and style is a file under `app/`.

## Original art only

All artwork is drawn by the app itself (sunset gradients, sun disc, palm
silhouettes, lettering). No Rockstar Games logo, official artwork, character
or font is used anywhere. The two sample photos under `app/samples/` were made
with an image model for make.fun and are free to use.

## Hand in (the bounty program)

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
to `/output` and writes `/output/dossier.json` with the vendored
`vendor/makefun-app.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots live in `screenshots/` (see `shots.json` for the scenes that
produced them — each is the app itself, running in a browser).

## License

MIT — see [LICENSE](LICENSE).
