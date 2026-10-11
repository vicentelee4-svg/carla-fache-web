const DATA_VERSION = '__DATA_VERSION__';
let DATA, currentImages = [],
  activeIndex = 0,
  lang = 'en',
  galleryFilter = 'all';
const main = document.querySelector('main'),
  dialog = document.querySelector('#lightbox');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealedTargets = new Set();
const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  for (const entry of entries)
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
      revealedTargets.delete(entry.target)
    }
}, {
  threshold: 0.04,
  rootMargin: '0px 0px -20px 0px'
}) : null;

function resetMotion() {
  revealObserver?.disconnect();
  revealedTargets.clear()
}

// SVG arrows cannot be substituted by the phone's emoji font.
const arrowPaths = {
  '↗': 'M5 19 19 5M5 5h14v14',
  '←': 'M20 12H4m7-7-7 7 7 7',
  '→': 'M4 12h16m-7-7 7 7-7 7',
  '↑': 'M12 20V4m-7 7 7-7 7 7',
  '⤢': 'M9 15 4 20m0-6v6h6M15 9l5-5m-6 0h6v6'
};
function arrowSVG(symbol) {
  return `<svg class="arrow-icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${arrowPaths[symbol[0]]}"></path></svg>`;
}
function renderArrowIcons(root) {
  if (!document.createTreeWalker) return;
  root.querySelectorAll('a,button').forEach(element => {
    const walker = document.createTreeWalker(element, 4);
    const texts = [];
    while (walker.nextNode()) if (/[↗←→↑⤢]/.test(walker.currentNode.data)) texts.push(walker.currentNode);
    for (const text of texts) {
      const fragment = document.createDocumentFragment();
      for (const part of text.data.split(/([↗←→↑⤢][\ufe0e\ufe0f]?)/)) {
        if (arrowPaths[part[0]]) {
          const template = document.createElement('template');
          template.innerHTML = arrowSVG(part);
          fragment.append(template.content);
        } else fragment.append(document.createTextNode(part));
      }
      text.replaceWith(fragment);
    }
  });
}

function enhanceMotion(root = main) {
  renderArrowIcons(root);
  if (reducedMotion.matches || !revealObserver) return;
  for (const el of revealedTargets)
    if (!el.isConnected) {
      revealObserver.unobserve(el);
      revealedTargets.delete(el)
    }
  const selector = '.hero-copy,.hero-art,.section-head,.series-card,.about-grid > img,.about-grid > div,.contact-band,.page-head,.artwork,.bio-layout > img,.reading,.cv-document,.image-gallery figure,.artsy-layout > img,.artsy-layout > div,.gallery-card,.collect-intro,.collect-help,.detail-photo,.detail-info,.room-section,.detail-related';
  root.querySelectorAll(selector).forEach((el, i) => {
    if (el.classList.contains('motion-reveal')) return;
    el.classList.add('motion-reveal');
    el.style.setProperty('--reveal-delay', `${Math.min(i%3,2)*65}ms`);
    revealObserver.observe(el);
    revealedTargets.add(el);
  });
}

function handleMotionPreference() {
  if (reducedMotion.matches) {
    resetMotion();
    main.querySelectorAll('.motion-reveal').forEach(el => el.classList.add('is-visible'));
  } else enhanceMotion();
}
if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', handleMotionPreference);
else reducedMotion.addListener?.(handleMotionPreference);

document.addEventListener('focusin', e => {
  const el = e.target.closest('.motion-reveal');
  if (el) {
    el.classList.add('is-visible');
    revealObserver?.unobserve(el);
    revealedTargets.delete(el)
  }
});

function animateArtworkImage(img) {
  if (reducedMotion.matches || !img.animate) return;
  let finished = false;
  const fade = () => {
    if (finished) return;
    finished = true;
    img.getAnimations().forEach(a => a.cancel());
    img.animate([{
      opacity: 0.35
    }, {
      opacity: 1
    }], {
      duration: 340,
      easing: 'ease-out'
    })
  };
  img.onload = fade;
  if (img.complete && img.naturalWidth) fade();
}

const series = ['metaphysical', 'intuitiveline', 'galactic', 'action', 'installation'];
const names = {
  metaphysical: 'Metaphysical Paintings',
  intuitiveline: 'Intuitiveline Paintings',
  galactic: 'Galactic Paintings',
  action: 'Action Paintings',
  installation: 'Installation'
};
const esc = s => String(s || '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
} [c]));

function clean(s) {
  const t = document.createElement('template');
  t.innerHTML = s;
  t.content.querySelectorAll('script,style,iframe').forEach(el => el.remove());
  t.content.querySelectorAll('*').forEach(el => {
    for (const a of [...el.attributes])
      if (a.name !== 'href') el.removeAttribute(a.name);
    if (el.tagName === 'A' && !/^(https?:|mailto:)/i.test(el.getAttribute('href') || '')) el.removeAttribute('href')
  });
  return t.innerHTML
}
const image = (a, cls = '', eager = false) => {
  const sources = a.responsiveWidths ? [
    ...a.responsiveWidths.map(width => [a.image.replace('assets/', 'assets/responsive/').replace(/\.webp$/, '-' + width + '.webp'), width]),
    [a.image, a.width]
  ] : a.responsiveSources || (a.thumb400 ? [
    [a.thumb400, a.thumb400Width],
    [a.thumb800, a.thumb800Width]
  ] : []);
  return `<img class="${cls}" src="/${a.image}" alt="${esc(a.alt)}" ${sources.length?`srcset="${sources.map(([path,width])=>'/'+path+' '+width+'w').join(', ')}" sizes="${a.sizes||'(max-width:600px) 90vw, (min-width:1800px) 750px, 45vw'}"`:''} ${a.width?`width="${a.width}" height="${a.height}"`:''} loading="${eager?'eager':'lazy'}" ${eager?'fetchpriority="high"':''} decoding="async">`
};

function head(title, subtitle = '', back = false) {
  return `<div class="page-head"><div>${back?'<a class="back" href="#works">← All works</a>':'<span class="eyebrow muted">Carla Fache · Visual artist</span>'}<h1>${title}</h1></div>${subtitle?`<p>${subtitle}</p>`:''}</div>`
}

function contactBand() {
  return `<section class="contact-band shell"><span class="eyebrow muted">Inquiries & private viewings</span><h2>Let’s begin<br>a conversation.</h2><a class="contact-email" href="mailto:contact@carlafache.com">contact@carlafache.com ↗</a></section>`
}

function home() {
  const art = DATA.metaphysical.images[0];
  currentImages = [art];
  main.innerHTML = `<div class="shell"><section class="hero"><div class="hero-copy"><span class="eyebrow muted">Chilean-born · Miami-based</span><h1>Color.<br>Light.<br><em>Beyond.</em></h1><p class="description">An exploration of color, materiality and the possibilities of perception through painting.</p><a class="text-link" href="#works">Explore the works <span>↗</span></a></div><figure class="hero-art"><button data-art="0" aria-label="View Breathe In">${image(art,'',true)}</button><figcaption class="art-meta"><span>Breathe In, 2017</span><span>Acrylic on canvas</span></figcaption></figure></section><section><div class="section-head"><div><span class="eyebrow muted">The work</span><h2>Five paths into color.</h2></div><a href="#works">View all works ↗</a></div><div class="series-grid">${series.map((k,i)=>`<a class="series-card" href="#${k}"><div class="frame">${image(DATA.home.images[i])}</div><div class="series-caption"><small>0${i+1}</small><h3>${names[k]}</h3><span>↗</span></div></a>`).join('')}</div></section></div>${collectPreview()}<section class="home-about"><div class="shell about-grid">${image(DATA.bio.images[0])}<div><span class="eyebrow muted">The artist</span><h2>A practice between<br>matter and perception.</h2><p>Born in Santiago, Chile, Carla Fache has been based in Miami since 2000. Her abstract practice brings color, light and texture into a dialogue with the act of seeing.</p><a class="text-link" href="#bio">Meet Carla Fache <span>↗</span></a></div></div></section>${contactBand()}`
}

function renderArt(items) {
  currentImages = items;
  const container = document.querySelector('#gallery');
  container.className = items.length ? 'gallery' : 'no-results';
  container.innerHTML = items.length ? items.map((a, i) => `<figure class="artwork"><button data-art="${i}" aria-label="View ${esc(a.caption||a.alt)}">${image({...a,sizes:'(max-width:420px) 90vw, (max-width:1100px) 43vw, (min-width:1800px) 505px, 28vw'})}</button><figcaption>${a.caption?esc(a.caption):esc(a.seriesName||'Carla Fache')}</figcaption></figure>`).join('') : 'No works found. Try another title or series.';
  document.querySelector('#result-count').textContent = `${items.length} ${items.length===1?'work':'works'}`;
  enhanceMotion(container)
}

function works(k) {
  galleryFilter = k || 'all';
  main.innerHTML = `<div class="shell">${head(k?names[k]:'Works','Paintings and installations.<br>Explore a series or open a work to take a closer look.',!!k)}<div class="filters">${['all',...series].map(s=>`<button data-filter="${s}" class="${s===galleryFilter?'selected':''}">${s==='all'?'All works':names[s].replace(' Paintings','')}</button>`).join('')}<label class="search"><input id="art-search" type="search" aria-label="Search artworks" placeholder="Search works…"></label></div><div class="art-meta" style="margin:0 0 25px"><span id="result-count"></span><span>Click a work to view</span></div><div id="gallery"></div></div>`;
  updateGallery();
  document.querySelector('#art-search').addEventListener('input', scheduleGallerySearch)
}

function updateGallery() {
  const q = (document.querySelector('#art-search')?.value || '').toLowerCase();
  prepareArtworkIndex();
  const items = (galleryFilter === 'all' ? portfolioArtworks : DATA[galleryFilter].images).filter(a => searchText.get(a).includes(q));
  document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('selected', b.dataset.filter === galleryFilter));
  renderArt(items)
}

function langButtons() {
  return `<div class="language" aria-label="Reading language"><button data-lang="en" class="${lang==='en'?'selected':''}" lang="en">English</button><button data-lang="es" class="${lang==='es'?'selected':''}" lang="es">Español</button></div>`
}

function readingPage(k) {
  let blocks = DATA[k].texts.filter(t => !/^English - Spanish$/.test(strip(t)));
  let selected;
  if (k === 'bio') selected = blocks.filter(t => lang === 'es' ? strip(t).startsWith('Carla Fache es') : strip(t).startsWith('Carla Fache is'));
  else selected = blocks.filter(t => lang === 'es' ? /[áéíóúñ¿]/.test(strip(t)) : !/[áéíóúñ¿]/.test(strip(t)));
  if (!selected.length) selected = blocks;
  main.innerHTML = `<div class="shell">${head(k==='bio'?'Biography':'Artist statement')}${k==='bio'?`<div class="bio-layout">${image(DATA.bio.images[0],'',true)}<div class="reading" lang="${lang}">${langButtons()}${selected.map(clean).join('')}<a class="text-link" href="#cv">Explore the CV <span>↗</span></a></div></div>`:`<article class="reading" lang="${lang}">${langButtons()}${selected.map(clean).join('')}</article>`}</div>`
}

function strip(s) {
  const t = document.createElement('div');
  t.innerHTML = s;
  return t.textContent.trim()
}

function cv() {
  main.innerHTML = `<div class="shell">${head('Curriculum vitae','Exhibitions, awards, collections<br>and artistic practice.')}<div class="cv-document">${DATA.cv.texts.map(clean).join('')}</div></div>`
}

function photographic(k) {
  currentImages = DATA[k].images;
  main.innerHTML = `<div class="shell">${head(k==='studio'?'Inside the studio':'Viewing rooms',k==='studio'?'A closer look at the artist’s<br>work and creative space.':'Works in space.<br>Exhibitions and installation views.')}<div class="image-gallery">${currentImages.map((a,i)=>`<figure><button data-art="${i}" aria-label="View ${k} image ${i+1}">${image({...a,sizes:i===0?'(max-width:1100px) 90vw, 1000px':'(max-width:600px) 90vw, (min-width:1800px) 750px, 43vw'},'',i===0)}</button>${a.caption?`<figcaption>${esc(a.caption)}</figcaption>`:''}</figure>`).join('')}</div>${DATA[k].texts.map(clean).join('')}</div>`
}

// Build lookup/search indexes once rather than scanning and cloning every gallery record.
let indexedData, portfolioArtworks = [],
  artworkBySlug = new Map(),
  searchText = new WeakMap();

function prepareArtworkIndex() {
  if (indexedData === DATA) return;
  indexedData = DATA;
  portfolioArtworks = series.flatMap(k => DATA[k].images);
  artworkBySlug = new Map([...portfolioArtworks, ...DATA.collect.images].map(a => [a.slug, a]));
  searchText = new WeakMap(portfolioArtworks.map(a => [a, `${a.caption||a.alt} ${a.seriesName}`.toLowerCase()]));
}
let searchTimer;

function scheduleSearch(update) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(update, 120)
}

function scheduleGallerySearch() {
  scheduleSearch(updateGallery)
}

function scheduleCollectSearch() {
  scheduleSearch(updateCollect)
}

let savedArtworks = new Set();
try {
  const stored = JSON.parse(localStorage.getItem('carla-fache-favorites') || '[]');
  if (Array.isArray(stored)) savedArtworks = new Set(stored.filter(x => typeof x === 'string'))
} catch {}
const fallbackExchange = {
  "rates": {
    "USD": 1,
    "EUR": 0.892438,
    "CLP": 978.602338
  },
  "updatedAt": 1791676951,
  "nextUpdate": 1791765021
};

// Reuse locale formatters for all price cards.
const moneyFormatters = {
  USD: new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2
  }),
  EUR: new Intl.NumberFormat('en-IE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }),
  CLP: new Intl.NumberFormat('es-CL', {
    maximumFractionDigits: 0
  })
};
const rateDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC'
});
let exchangeRequestPending = false;
let displayCurrency = 'USD',
  exchange = fallbackExchange;
try {
  const preference = localStorage.getItem('carla-fache-currency');
  if (['USD', 'EUR', 'CLP'].includes(preference)) displayCurrency = preference;
  const cache = JSON.parse(localStorage.getItem('carla-fache-exchange') || 'null');
  if (validExchange(cache) && cache.updatedAt >= exchange.updatedAt) exchange = cache
} catch {}

function validExchange(data) {
  return data && Number.isFinite(data.updatedAt) && Number.isFinite(data.nextUpdate) && data.rates?.USD === 1 && ['EUR', 'CLP'].every(code => Number.isFinite(data.rates[code]) && data.rates[code] > 0)
}

function convertedAmount(usd, code = displayCurrency) {
  return usd * exchange.rates[code]
}

function shopPrice(a) {
  if (typeof a.price !== 'number') return 'Price on request';
  const value = convertedAmount(a.price);
  if (displayCurrency === 'CLP') return '≈ $' + moneyFormatters.CLP.format(value);
  if (displayCurrency === 'EUR') return '≈ €' + moneyFormatters.EUR.format(value);
  return 'US$' + moneyFormatters.USD.format(value)
}

function currencySelector() {
  return `<label class="currency-selector"><span>Currency</span><select data-currency aria-label="Display currency">${[['USD','USD · US dollars'],['EUR','EUR · Euros'],['CLP','CLP · Chilean pesos']].map(([code,label])=>`<option value="${code}" ${code===displayCurrency?'selected':''}>${label}</option>`).join('')}</select></label>`
}

function priceMarkup(a) {
  return `<span data-price="${esc(a.slug)}">${shopPrice(a)} <small>${displayCurrency}</small></span>`
}

function currencyNote() {
  if (displayCurrency === 'USD') return '';
  const date = rateDateFormatter.format(new Date(exchange.updatedAt * 1000));
  return `Approximate conversion from the original USD price. Rates dated ${date}. Final price, shipping, taxes and payment currency are confirmed on Artsy. <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener">Rates by ExchangeRate-API</a>.`
}

function refreshDisplayedCurrency() {
  document.querySelectorAll('[data-price]').forEach(el => {
    const a = DATA && findArtwork(el.dataset.price);
    if (a) el.innerHTML = `${shopPrice(a)} <small>${displayCurrency}</small>`
  });
  document.querySelectorAll('[data-currency]').forEach(el => el.value = displayCurrency);
  document.querySelectorAll('[data-fx-note]').forEach(el => el.innerHTML = currencyNote());
  if (dialog.open && currentImages[activeIndex]?.url) {document.querySelector('#inquire').textContent = 'Buy on Artsy · ' + shopPrice(currentImages[activeIndex]) + ' ↗';renderArrowIcons(dialog)}
}
async function refreshExchange() {
  if (exchangeRequestPending || exchange.nextUpdate * 1000 > Date.now()) return;
  exchangeRequestPending = true;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal
    });
    if (!response.ok) throw Error('Rate service unavailable');
    const body = await response.json();
    const fresh = {
      rates: {
        USD: body.rates?.USD,
        EUR: body.rates?.EUR,
        CLP: body.rates?.CLP
      },
      updatedAt: body.time_last_update_unix,
      nextUpdate: body.time_next_update_unix
    };
    if (body.result !== 'success' || body.base_code !== 'USD' || !validExchange(fresh)) throw Error('Invalid exchange rates');
    exchange = fresh;
    try {
      localStorage.setItem('carla-fache-exchange', JSON.stringify(fresh))
    } catch {}
    refreshDisplayedCurrency()
  } catch {
    /* Keep the most recent verified rates; the displayed date remains visible. */
  } finally {
    clearTimeout(timeout);
    exchangeRequestPending = false
  }
}
document.addEventListener('change', e => {
  if (e.target.matches('[data-currency]') && ['USD', 'EUR', 'CLP'].includes(e.target.value)) {
    displayCurrency = e.target.value;
    try {
      localStorage.setItem('carla-fache-currency', displayCurrency)
    } catch {}
    refreshDisplayedCurrency();
    refreshExchange()
  }
});

function saveButton(a, detail = false) {
  const saved = savedArtworks.has(a.slug);
  return `<button class="${detail?'detail-save':'favorite-button'}" data-save="${esc(a.slug)}" aria-pressed="${saved}" aria-label="${saved?'Remove from':'Add to'} favorites: ${esc(a.title)}">${detail?(saved?'♥ Saved':'♡ Save artwork'):(saved?'♥':'♡')}</button>`
}

function collectCard(a) {
  return `<article class="gallery-card"><div class="gallery-image"><a class="gallery-frame" data-collect-art="${DATA.collect.images.indexOf(a)}" href="${a.page}" aria-label="View ${esc(a.title)}">${image({...a,sizes:'(max-width:420px) 90vw, (max-width:700px) 43vw, 28vw'})}</a>${saveButton(a)}</div><div class="gallery-info"><span class="gallery-artist">Carla Fache <span>${esc(a.year)}</span></span><h3><a href="${a.page}">${esc(a.title)}</a></h3><p class="gallery-medium">${esc(a.medium)}<br>${esc(a.dimensions)}</p><p class="gallery-price">${priceMarkup(a)}</p><a class="gallery-buy" href="${esc(a.url)}" target="_blank" rel="noopener">Buy on Artsy <span>↗</span></a></div></article>`
}

function collectPreview() {
  return `<section class="collect-preview shell" lang="en"><div class="section-head"><div><span class="eyebrow muted">Art for your collection</span><h2>One work. A new space.</h2></div><div class="gallery-head-actions">${currencySelector()}<a href="/#collect">Explore the gallery ↗</a></div></div><div class="shop-grid">${DATA.collect.images.slice(0,3).map(collectCard).join('')}</div><p class="gallery-note">Original listing prices are in USD. Purchase and availability on Artsy.</p><p class="gallery-note fx-note" data-fx-note>${currencyNote()}</p></section>`
}

function collect() {
  main.innerHTML = `<div class="shell collect-page" lang="en">${head('Art gallery','A selection of works by Carla Fache.<br>Find a piece for your collection.')}<div class="collect-intro"><p>Color, materiality and new ways of seeing.<br>Explore the works and continue your purchase on Artsy.</p><label class="saved-filter"><input id="saved-only" type="checkbox"> Saved works <span id="saved-total">${savedArtworks.size}</span></label></div><div class="collect-toolbar"><label class="collect-search"><span>Find an artwork</span><input type="search" id="collect-search" placeholder="Title, year or medium…"></label><label><span>Medium</span><select id="collect-category"><option value="all">All media</option><option value="painting">Acrylic painting</option><option value="mixed">Mixed media</option></select></label><label><span>Size · longest side</span><select id="collect-size"><option value="all">All sizes</option><option value="small">Small · up to 60 cm</option><option value="medium">Medium · 61–120 cm</option><option value="large">Large · over 120 cm</option></select></label><label><span>Color</span><select id="collect-color"><option value="all">All colors</option>${['blue','purple','red','yellow','green','orange','neutral'].map(c=>`<option value="${c}">${c[0].toUpperCase()+c.slice(1)}</option>`).join('')}</select></label><label><span>Sort by</span><select id="collect-sort"><option value="recent">Year: newest first</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="title">Artwork title</option></select></label></div><div class="collect-count"><span id="collect-count" aria-live="polite"></span><button class="clear-filters" id="clear-collect">Reset filters</button>${currencySelector()}</div><div id="collect-grid" class="shop-grid"></div><p class="gallery-note">Prices published on Artsy, checked October 11, 2026. Availability, shipping and taxes are confirmed on the artwork’s Artsy listing. Favorites are saved in this browser.</p><p class="gallery-note fx-note" data-fx-note>${currencyNote()}</p><div class="collect-help"><div><span class="eyebrow muted">A personal selection</span><h2>Which work speaks to you?</h2><p>For artwork inquiries or to arrange a private viewing, let’s talk.</p></div><a class="text-link" href="/#contact">Contact Carla <span>↗</span></a></div></div>`;
  updateCollect();
  document.querySelector('#collect-search').addEventListener('input', scheduleCollectSearch);
  document.querySelectorAll('#collect-category,#collect-sort,#collect-size,#collect-color,#saved-only').forEach(el => el.addEventListener('change', updateCollect));
  document.querySelector('#clear-collect').onclick = () => {
    document.querySelector('#collect-search').value = '';
    ['category', 'size', 'color'].forEach(k => document.querySelector('#collect-' + k).value = 'all');
    document.querySelector('#collect-sort').value = 'recent';
    document.querySelector('#saved-only').checked = false;
    updateCollect()
  }
}

function filteredCollect(q, category, size, color, saved, order) {
  const items = DATA.collect.images.filter(a => (category === 'all' || a.category === category) && (size === 'all' || a.size === size) && (color === 'all' || a.colors.includes(color)) && (!saved || savedArtworks.has(a.slug)) && `${a.title} ${a.year} ${a.medium}`.toLocaleLowerCase().includes(q));
  if (order === 'price-asc') items.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  else if (order === 'price-desc') items.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
  else if (order === 'title') items.sort((a, b) => a.title.localeCompare(b.title));
  else items.sort((a, b) => Number(b.year) - Number(a.year));
  return items
}

function updateCollect() {
  const q = document.querySelector('#collect-search').value.trim().toLocaleLowerCase();
  const items = filteredCollect(q, document.querySelector('#collect-category').value, document.querySelector('#collect-size').value, document.querySelector('#collect-color').value, document.querySelector('#saved-only').checked, document.querySelector('#collect-sort').value);
  const grid = document.querySelector('#collect-grid');
  grid.innerHTML = items.length ? items.map(collectCard).join('') : '<div class="no-results">No artworks match this selection. Try another filter or save a work to build your collection.</div>';
  document.querySelector('#collect-count').textContent = `${items.length} ${items.length===1?'artwork':'artworks'}`;
  document.querySelector('#saved-total').textContent = savedArtworks.size;
  enhanceMotion(grid)
}

function findArtwork(slug) {
  prepareArtworkIndex();
  return artworkBySlug.get(slug)
}

function artworkDetail(slug) {
  const a = findArtwork(slug);
  if (!a) {
    collect();
    return
  }
  if (!a.title) {
    portfolioDetail(a);
    return
  }
  document.title = `${a.title} — Carla Fache`;
  const i = DATA.collect.images.indexOf(a);
  const related = DATA.collect.images.filter(x => x.slug !== slug).slice(0, 3);
  main.innerHTML = `<div class="shell artwork-page"><a class="back detail-back" href="/#collect">← Back to gallery</a><section class="artwork-detail"><div class="detail-photo"><button class="detail-image" data-collect-art="${i}" aria-label="Enlarge ${esc(a.title)}">${image({...a,sizes:'(max-width:700px) 90vw, 52vw'},'',true)}</button><button class="detail-zoom" data-collect-art="${i}">Zoom artwork ⤢</button></div><div class="detail-info"><span class="eyebrow muted">Carla Fache · ${esc(a.year)}</span><h1>${esc(a.title)}</h1><p class="detail-medium">${esc(a.medium)}</p><dl><div><dt>Dimensions</dt><dd>${esc(a.dimensions)}</dd></div><div><dt>Year</dt><dd>${esc(a.year)}</dd></div><div><dt>Gallery on Artsy</dt><dd>${esc(a.gallery)}</dd></div></dl>${currencySelector()}<p class="gallery-price">${priceMarkup(a)}</p><a class="gallery-buy" href="${esc(a.url)}" target="_blank" rel="noopener">Buy on Artsy <span>↗</span></a><p class="gallery-note">Confirm availability, shipping and taxes on Artsy.</p><p class="gallery-note fx-note" data-fx-note>${currencyNote()}</p><div class="detail-actions">${saveButton(a,true)}<a class="whatsapp-share" href="${whatsappURL(a)}" target="_blank" rel="noopener">Share on WhatsApp ↗</a><button data-share="${esc(a.slug)}">Share artwork ↗</button><button data-view-room="${i}">View in a room</button></div><p class="share-status" id="share-status" aria-live="polite"></p></div></section><section class="room-section" id="room-preview"><div class="section-head"><div><span class="eyebrow muted">Imagine it in your space</span><h2>Room preview</h2></div><span class="muted room-label">${esc(a.dimensions)}</span></div><div class="room-layout"><div class="room-stage" id="room-stage"><div class="room-floor"></div><div class="room-work ${a.previewShape==='diamond'?'diamond-work':''}" id="room-work" style="aspect-ratio:${a.artRatio};${a.previewClip?'clip-path:'+a.previewClip:''}">${roomArtworkImage(a)}</div><div class="room-bench" aria-hidden="true"></div><span class="room-measure" id="room-measure"></span></div><div class="room-controls"><label for="wall-width">Wall width <output id="wall-output">4.0 m</output></label><input type="range" id="wall-width" min="280" max="600" step="10" value="400"><span class="control-title">Wall color</span>${wallSwatches()}<p class="gallery-note">An approximate scale guide based on the published width. Artwork image proportions are preserved. Wall height: 2.8 m. Furniture is illustrative.</p></div></div></section><section class="detail-related"><div class="section-head"><div><span class="eyebrow muted">Continue exploring</span><h2>More works</h2></div><a href="/#collect">View all works ↗</a></div><div class="shop-grid">${related.map(collectCard).join('')}</div></section></div>`;
  const width = document.querySelector('#wall-width');
  width.addEventListener('input', () => updateRoom(a, Number(width.value)));
  updateRoom(a, 400)
}

const wallColors = [
  ['#efeee9', 'Warm white'],
  ['#ddd8ce', 'Sand'],
  ['#cdd3d0', 'Sage gray'],
  ['#6f7273', 'Charcoal']
];

function wallSwatches(viewer = false) {
  return `<div class="wall-colors">${wallColors.map(([color,label],i)=>`<button data-${viewer?'viewer-wall':'wall'}="${color}" class="${i===0?'selected':''}" aria-label="${label} wall" aria-pressed="${i===0}" style="background:${color}"></button>`).join('')}</div>`;
}

function roomArtworkImage(a) {
  const [x, y, width, height] = a.previewCrop;
  return `<img src="/${a.image}" alt="${esc(a.title||a.alt)} in a room preview" decoding="async" style="width:${100/width}%;height:${100/height}%;left:${-100*x/width}%;top:${-100*y/height}%">`;
}

function updateRoom(a, width) {
  document.querySelector('#room-stage').style.aspectRatio = `${width}/280`;
  document.querySelector('#room-work').style.width = `${100*a.widthCm/width}%`;
  document.querySelector('#wall-output').textContent = (width / 100).toFixed(1) + ' m';
  document.querySelector('#room-measure').textContent = (width / 100).toFixed(1) + ' m wall'
}

function whatsappURL(a) {
  return 'https://wa.me/?text=' + encodeURIComponent((a.shareTitle || a.title || a.caption || a.alt) + ' — Carla Fache\n' + location.origin + a.page)
}

function portfolioDetail(a) {
  currentImages = [a];
  document.title = (a.shareTitle || a.alt) + ' — Carla Fache';
  main.innerHTML = `<div class="shell artwork-page"><a class="back detail-back" href="/#works">← All works</a><section class="artwork-detail"><div class="detail-photo"><button class="detail-image" data-art="0" aria-label="Enlarge artwork">${image({...a,sizes:'(max-width:700px) 90vw, (min-width:1800px) 750px, 52vw'},'',true)}</button></div><div class="detail-info"><span class="eyebrow muted">Carla Fache · ${esc(a.seriesName)}</span><h1 class="portfolio-title">${esc(a.shareTitle||a.alt)}</h1><a class="gallery-buy" href="mailto:contact@carlafache.com?subject=${encodeURIComponent(a.shareTitle||a.alt)}">Inquire about this work ↗</a><div class="detail-actions"><button data-share="${esc(a.slug)}">Share artwork ↗</button><a class="whatsapp-share" href="${whatsappURL(a)}" target="_blank" rel="noopener">Share on WhatsApp ↗</a><button data-room-current>View in a room</button></div><p class="share-status" id="share-status" aria-live="polite"></p></div></section></div>`
}
async function shareArtwork(a) {
  const url = location.origin + a.page;
  const status = dialog.open ? document.querySelector('#viewer-share-status') : document.querySelector('#share-status');
  try {
    if (navigator.share) await navigator.share({
      title: (a.shareTitle || a.title || a.alt) + ' — Carla Fache',
      text: a.shareDescription || a.caption || a.alt,
      url
    });
    else {
      await navigator.clipboard.writeText(url);
      if (status) status.textContent = 'Artwork link copied.'
    }
  } catch (error) {
    if (error.name === 'AbortError') return;
    if (status) {
      status.textContent = 'Copy this artwork link: ';
      const link = document.createElement('a');
      link.href = url;
      link.textContent = url;
      status.append(link)
    }
  }
}

function artsy() {
  main.innerHTML = `<div class="shell">${head('Works on Artsy')}<div class="artsy-layout">${image(DATA.home.images[2],'',true)}<div><span class="eyebrow muted">Available works</span><h2>Continue your<br>exploration.</h2><p>Discover selected works by Carla Fache on Artsy and contact the gallery for availability and collecting inquiries.</p><a class="text-link" href="https://www.artsy.net/artist/carla-fache/works?page=1&sort=-partner_updated_at" target="_blank" rel="noopener">View works on Artsy <span>↗</span></a></div></div></div>`
}

function contact() {
  main.innerHTML = `<div class="shell">${head('Contact','Portfolio inquiries, commissioned<br>artwork and private viewings.')}<div class="contact-band" style="padding-top:15px"><span class="eyebrow muted">Carla Fache</span><h2>A new work.<br>A closer look.<br>A conversation.</h2><a class="contact-email" href="mailto:contact@carlafache.com">contact@carlafache.com ↗</a><p class="muted" style="font-size:13px;line-height:2;margin-top:30px">Miami, USA · Santiago, Chile</p><div style="display:flex;gap:30px"><a class="text-link" href="https://www.instagram.com/carlafache/" target="_blank" rel="noopener">Instagram ↗</a><a class="text-link" href="#artsy">Artsy ↗</a></div></div></div>`
}

function route() {
  if (!DATA) return;
  clearTimeout(searchTimer);
  resetMotion();
  const artworkPath = location.pathname.replace(/\.html$/, '').match(/\/artworks\/([^/]+)$/);
  const k = location.hash.slice(1) || (artworkPath ? 'artwork/' + artworkPath[1] : 'home');
  dialog.close();
  document.querySelector('#nav').classList.remove('open');
  document.querySelector('#menu-toggle').setAttribute('aria-expanded', 'false');
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('active', a.hash === `#${series.includes(k)?'works':k.startsWith('artwork/')?'collect':k}`));
  document.title = `${names[k]||({home:'Visual Artist',works:'Works',bio:'Biography',cv:'CV',statement:'Artist Statement',viewing:'Viewing Rooms',studio:'Studio',artsy:'Artsy',collect:'Art gallery',contact:'Contact'}[k]||'Visual Artist')} — Carla Fache`;
  if (k.startsWith('artwork/')) artworkDetail(k.slice(8));
  else if (k === 'home') home();
  else if (k === 'works' || series.includes(k)) works(series.includes(k) ? k : null);
  else if (k === 'bio' || k === 'statement') readingPage(k);
  else if (k === 'cv') cv();
  else if (k === 'viewing' || k === 'studio') photographic(k);
  else if (k === 'collect') collect();
  else if (k === 'artsy') artsy();
  else if (k === 'contact') contact();
  else home();
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'instant'
  });
  enhanceMotion()
}

let viewerMode = 'artwork',
  viewerWallWidth = 400,
  viewerWallColor = '#efeee9';

function viewerRoomArtwork(a) {
  if (a.widthCm) return a;
  const match = (a.caption || '').match(/([\d.]+)\s*[x×]\s*([\d.]+)\s*(inches|in\b|cm\b)/i);
  const factor = match && match[3].toLowerCase() !== 'cm' ? 2.54 : 1;
  return {
    ...a,
    widthCm: match ? Number(match[2]) * factor : 80,
    heightCm: match ? Number(match[1]) * factor : null,
    estimatedWidth: !match,
    previewCrop: a.previewCrop || [0, 0, 1, 1],
    artRatio: a.artRatio || (a.width && a.height ? a.width / a.height : 1),
    previewShape: a.previewShape || 'rectangle'
  }
}

function renderViewerRoom() {
  const original = currentImages[activeIndex],
    a = viewerRoomArtwork(original);
  if (a.roomUnavailable) {
    document.querySelector('#viewer-room').innerHTML = '<p class="room-unavailable">This exhibition photograph contains several works. An isolated artwork image is needed for a room preview.</p>';
    return
  }
  document.querySelector('#viewer-room').innerHTML = `<div class="room-layout viewer-room-layout"><div class="room-stage" id="viewer-room-stage" style="background:${viewerWallColor}"><div class="room-floor"></div><div class="room-work ${a.previewShape==='diamond'?'diamond-work':''}" id="viewer-room-work" style="aspect-ratio:${a.artRatio};${a.previewClip?'clip-path:'+a.previewClip:''}">${roomArtworkImage(a)}</div><div class="room-bench" aria-hidden="true"></div><span class="room-measure" id="viewer-room-measure"></span></div><div class="room-controls"><label for="viewer-wall-width">Wall width <output id="viewer-wall-output">4.0 m</output></label><input id="viewer-wall-width" type="range" min="280" max="600" step="10" value="${viewerWallWidth}"><label for="viewer-art-width">Artwork width (cm)</label><input id="viewer-art-width" type="number" min="1" max="600" step="0.1" value="${Number(a.widthCm.toFixed(1))}"><p class="viewer-width-note">${a.estimatedWidth?'Enter the artwork’s actual width to set the scale.':`Published width: ${Number(a.widthCm.toFixed(1))} cm.`}</p><span class="control-title">Wall color</span>${wallSwatches(true)}<p class="gallery-note">Approximate scale guide. Image proportions are preserved. Wall height: 2.8 m. Furniture is illustrative.</p></div></div>`;
  const update = () => {
    const wall = Number(document.querySelector('#viewer-wall-width').value),
      art = Number(document.querySelector('#viewer-art-width').value);
    if (!Number.isFinite(art) || art < 1 || art > 600) return;
    document.querySelector('#viewer-room-stage').style.aspectRatio = `${wall}/280`;
    viewerWallWidth = wall;
    document.querySelector('#viewer-room-work').style.width = `${100*art/wall}%`;
    document.querySelector('#viewer-wall-output').textContent = (wall / 100).toFixed(1) + ' m';
    document.querySelector('#viewer-room-measure').textContent = (wall / 100).toFixed(1) + ' m wall'
  };
  document.querySelector('#viewer-wall-width').addEventListener('input', update);
  document.querySelector('#viewer-art-width').addEventListener('input', update);
  document.querySelectorAll('[data-viewer-wall]').forEach(b => {
    const selected = b.dataset.viewerWall === viewerWallColor;
    b.classList.toggle('selected', selected);
    b.setAttribute('aria-pressed', String(selected))
  });
  update()
}

function setViewerMode(mode) {
  viewerMode = mode;
  const room = mode === 'room';
  document.querySelector('.viewer-image').hidden = room;
  document.querySelector('#viewer-room').hidden = !room;
  document.querySelector('#viewer-art-mode').setAttribute('aria-pressed', String(!room));
  document.querySelector('#viewer-room-mode').setAttribute('aria-pressed', String(room));
  if (room) renderViewerRoom()
}

function openViewer(mode = 'artwork') {
  if (!currentImages[activeIndex]) return;
  viewerMode = 'artwork';
  displayArt();
  dialog.showModal();
  document.body.style.overflow = 'hidden';
  setViewerMode(mode)
}
document.querySelector('#viewer-art-mode').onclick = () => setViewerMode('artwork');
document.querySelector('#viewer-room-mode').onclick = () => setViewerMode('room');

function displayArt() {
  const a = currentImages[activeIndex];
  const img = document.querySelector('#full-image');
  img.onload = null;
  img.src = "/" + a.image;
  img.alt = a.alt;
  animateArtworkImage(img);
  document.querySelector('#full-caption').textContent = a.caption || a.seriesName || a.alt;
  document.querySelector('#viewer-count').textContent = `${String(activeIndex+1).padStart(2,'0')} / ${String(currentImages.length).padStart(2,'0')}`;
  document.querySelector('#inquire').href = `mailto:contact@carlafache.com?subject=${encodeURIComponent('Artwork inquiry — '+(a.caption||a.alt))}`;
  document.querySelectorAll('#prev-art,#next-art').forEach(b => b.hidden = currentImages.length < 2);
  const buy = document.querySelector('#inquire');
  buy.textContent = a.url ? 'Buy on Artsy · ' + shopPrice(a) + ' ↗' : 'Inquire about this work ↗';
  if (a.url) buy.href = a.url;
  buy.target = a.url ? '_blank' : '_self';
  buy.rel = a.url ? 'noopener' : '';
  const shareStatus = document.querySelector('#viewer-share-status');
  if (shareStatus) shareStatus.textContent = '';
  const share = document.querySelector('#viewer-share'),
    wa = document.querySelector('#viewer-whatsapp');
  if (share) {
    share.hidden = !a.page;
    share.onclick = () => shareArtwork(a)
  }
  if (wa) {
    wa.hidden = !a.page;
    if (a.page) wa.href = whatsappURL(a)
  }
  const detail = document.querySelector('#viewer-detail-link');
  detail.hidden = !a.page;
  if (a.page) detail.href = a.page;
  setViewerMode(viewerMode);
  renderArrowIcons(dialog);
}

function stepArt(n) {
  if (!currentImages.length) return;
  activeIndex = (activeIndex + n + currentImages.length) % currentImages.length;
  displayArt()
}
dialog.addEventListener('close', () => document.body.style.overflow = '');
document.querySelector('#close-viewer').onclick = () => dialog.close();
document.querySelector('#prev-art').onclick = () => stepArt(-1);
document.querySelector('#next-art').onclick = () => stepArt(1);
document.addEventListener('keydown', e => {
  if (!dialog.open || e.target.matches('input,select,textarea') || e.target.isContentEditable) return;
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    stepArt(1)
  }
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    stepArt(-1)
  }
});
document.querySelector('#menu-toggle').onclick = () => {
  const open = document.querySelector('#nav').classList.toggle('open');
  document.querySelector('#menu-toggle').setAttribute('aria-expanded', String(open))
};
window.addEventListener('hashchange', route);
fetch('/data.json?v=' + DATA_VERSION).then(r => {
  if (!r.ok) throw Error('Gallery unavailable');
  return r.json()
}).then(d => {
  DATA = d;
  route();
  refreshExchange()
}).catch(() => {
  if (location.pathname.startsWith('/artworks/')) {
    const note = document.createElement('p');
    note.className = 'shell loading';
    note.textContent = 'Interactive features could not be loaded. Please reload to try again.';
    main.append(note);
    return
  }
  main.innerHTML = '<div class="shell"><h1>The gallery could not be loaded.</h1><p>Please reload the page, or <a href="mailto:contact@carlafache.com">contact Carla Fache</a>.</p></div>'
});

function toggleSavedArtwork(slug) {
  const artwork = findArtwork(slug);
  if (!artwork) return;
  savedArtworks.has(slug) ? savedArtworks.delete(slug) : savedArtworks.add(slug);
  try {
    localStorage.setItem('carla-fache-favorites', JSON.stringify([...savedArtworks]))
  } catch {}
  document.querySelectorAll('[data-save]').forEach(button => {
    const a = findArtwork(button.dataset.save);
    if (!a) return;
    const saved = savedArtworks.has(a.slug);
    button.setAttribute('aria-pressed', String(saved));
    button.setAttribute('aria-label', `${saved?'Remove from':'Add to'} favorites: ${a.title}`);
    button.textContent = button.classList.contains('detail-save') ? (saved ? '♥ Saved' : '♡ Save artwork') : (saved ? '♥' : '♡')
  });
  if (document.querySelector('#collect-grid')) updateCollect();
}

function changeWall(button, viewer = false) {
  const color = viewer ? button.dataset.viewerWall : button.dataset.wall;
  const stage = document.querySelector(viewer ? '#viewer-room-stage' : '#room-stage');
  if (!stage) return;
  if (viewer) viewerWallColor = color;
  stage.style.background = color;
  document.querySelectorAll(viewer ? '[data-viewer-wall]' : '[data-wall]').forEach(swatch => {
    const selected = swatch === button;
    swatch.classList.toggle('selected', selected);
    swatch.setAttribute('aria-pressed', String(selected))
  });
}

function handleClick(e) {
  const target = e.target;
  if (!target.closest) return;
  if (target.closest('.skip')) {
    e.preventDefault();
    main.focus();
    main.scrollIntoView({
      behavior: 'instant'
    });
    return
  }
  const save = target.closest('[data-save]');
  if (save) {
    toggleSavedArtwork(save.dataset.save);
    return
  }
  const share = target.closest('[data-share]');
  if (share) {
    shareArtwork(findArtwork(share.dataset.share));
    return
  }
  if (target.closest('[data-room-current]')) {
    activeIndex = 0;
    openViewer('room');
    return
  }
  const room = target.closest('[data-view-room]');
  if (room) {
    currentImages = DATA.collect.images;
    activeIndex = Number(room.dataset.viewRoom);
    openViewer('room');
    return
  }
  const swatch = target.closest('[data-viewer-wall],[data-wall]');
  if (swatch) {
    changeWall(swatch, Boolean(swatch.dataset.viewerWall));
    return
  }
  const card = target.closest('[data-collect-art]');
  if (card) {
    e.preventDefault();
    currentImages = DATA.collect.images;
    activeIndex = Number(card.dataset.collectArt);
    openViewer();
    return
  }
  const art = target.closest('[data-art]');
  if (art) {
    activeIndex = Number(art.dataset.art);
    openViewer();
    return
  }
  const filter = target.closest('[data-filter]');
  if (filter) {
    clearTimeout(searchTimer);
    galleryFilter = filter.dataset.filter;
    updateGallery();
    return
  }
  const language = target.closest('[data-lang]');
  if (language) {
    lang = language.dataset.lang;
    resetMotion();
    readingPage(location.hash.slice(1));
    enhanceMotion()
  }
}
document.addEventListener('click', handleClick);

renderArrowIcons(document);
