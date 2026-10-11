# Carla Fache — portfolio

A responsive static portfolio preserving the artist’s original images, captions, logo and visual identity. It includes all five artwork collections, English/Spanish biography and statement, CV, studio/viewing photographs, a priced Artsy gallery, browser-local favorites, USD/EUR/CLP display, fullscreen artwork and room previews, individual artwork links and WhatsApp sharing.

## Source and publication

- `src/app.js`: readable application source; one delegated click handler and cached artwork/search indexes.
- `src/style.css`: readable responsive styling and reduced-motion support.
- `src/data.json`: complete original records, provenance and responsive image candidates.
- `scripts/build.py`: writes compact JS/CSS/runtime JSON and versions their URLs across all static artwork pages.
- `scripts/generate-responsive-images.py`: creates high-quality 400/640 px variants only when they are smaller than the original. Original photographs are retained unchanged and are used by the fullscreen viewer and room previews.
- `dist/`: deployable site; 287 static artwork pages expose preview metadata without requiring JavaScript.
- `tests/behavior.cjs`: exercises both readable and shipped JavaScript to check filters, prices, favorites, artwork details, room framing, fullscreen modes and sharing.

Install development dependencies with `python -m pip install -r requirements-dev.txt`. After application changes, run:

```sh
python scripts/build.py
node --check dist/app.js
node tests/behavior.cjs
```

After replacing original artwork assets, update `src/data.json`, run `python scripts/generate-responsive-images.py`, then rebuild. The source and publication workflow uses `.openai/hosting.json`; the site requires no application server or runtime packages.

Artwork names and source photographs must remain unchanged. Currency conversions are estimates; Artsy determines the final purchase price and availability. Room scale is approximate and unknown artwork widths are editable. Open Graph previews require public crawler access; the site’s access settings are managed separately.

Original artwork and photography: © Carla Fache. All rights reserved.
