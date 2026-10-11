"""Rebuild shipped JS/CSS and runtime data; keep static artwork metadata intact."""
from pathlib import Path
import hashlib
import json
import re
import rjsmin
import rcssmin
from arrow_icons import replace_arrows

ROOT = Path(__file__).resolve().parents[1]
source_data = json.loads((ROOT / 'src/data.json').read_text())
for section in source_data.values():
    if isinstance(section, dict):
        for artwork in section.get('images', []):
            artwork.pop('sourceImage', None)
            artwork.pop('shareImage', None)
            if 'responsiveSources' in artwork:
                artwork['responsiveWidths'] = [width for path, width in artwork.pop('responsiveSources') if path != artwork['image']]
data = json.dumps(source_data, ensure_ascii=False, separators=(',', ':'))
(ROOT / 'dist/data.json').write_text(data)
data_version = hashlib.sha256(data.encode()).hexdigest()[:12]
js = rjsmin.jsmin((ROOT / 'src/app.js').read_text().replace('__DATA_VERSION__', data_version))
css = rcssmin.cssmin((ROOT / 'src/style.css').read_text())
(ROOT / 'dist/app.js').write_text(js + '\n')
(ROOT / 'dist/style.css').write_text(css + '\n')
js_version = hashlib.sha256(js.encode()).hexdigest()[:12]
css_version = hashlib.sha256(css.encode()).hexdigest()[:12]
for page in [ROOT / 'dist/index.html', *(ROOT / 'dist/artworks').glob('*.html')]:
    content = page.read_text()
    content = re.sub(r'/app\.js(?:\?v=[a-f0-9]+)?', '/app.js?v=' + js_version, content)
    content = re.sub(r'/style\.css(?:\?v=[a-f0-9]+)?', '/style.css?v=' + css_version, content)
    page.write_text(replace_arrows(content))
print(f'Built JS {len(js.encode()):,} bytes, CSS {len(css.encode()):,} bytes; versioned assets on all pages.')
