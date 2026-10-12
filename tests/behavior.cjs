// Functional regression checks for both readable source and the shipped script.
const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');
const path = require('path');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'dist/data.json'), 'utf8'));

function run(file) {
  const nodes = new Map();
  function node(selector) {
    if (!nodes.has(selector)) nodes.set(selector, {
      style: {}, dataset: {}, attributes: {}, hidden: false, open: false, value: '', checked: false,
      textContent: '', innerHTML: '', className: '', children: [],
      classList: { add() {}, remove() {}, toggle() { return false; }, contains() { return false; } },
      addEventListener(type, fn) { (this.events ||= {})[type] = fn; }, setAttribute(k, v) { this.attributes[k] = v; },
      querySelectorAll() { return []; }, querySelector() { return null; }, removeAttribute(k) { delete this.attributes[k]; },
      append(child) { this.children.push(child); }, focus() {}, scrollIntoView() {},
      showModal() { this.open = true; }, close() { this.open = false; },
      getAnimations() { return []; },
    });
    return nodes.get(selector);
  }
  const listeners = [];
  const storage = new Map();
  const ctx = {
    document: { querySelector: node, querySelectorAll: () => [], body: node('body'),
      addEventListener(type, fn) { listeners.push([type, fn]); }, createElement: () => node('created'), title: '' },
    window: { matchMedia: () => ({ matches: false, addEventListener() {} }), addEventListener() {}, scrollTo() {} },
    location: { origin: 'https://carla-fache-gallery.quirkyhero1.chatgpt.site', pathname: '/', hash: '' },
    navigator: { clipboard: { async writeText(text) { ctx.copied = text; } } },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    sessionStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    fetch: () => new Promise(() => {}), AbortController, setTimeout, clearTimeout, URL,
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx);
  ctx.data = data;
  vm.runInContext('DATA=data', ctx);
  assert.equal(listeners.filter(([type]) => type === 'click').length, 1);

  const art = data.collect.images[0];
  assert.equal(ctx.findArtwork(art.slug).title, art.title);
  assert.equal(ctx.filteredCollect('', 'all', 'all', 'all', false, 'price-asc').length, 12);
  assert.equal(ctx.filteredCollect('iluminado', 'all', 'all', 'all', false, 'recent').length, 1);
  for (const size of ['small', 'medium', 'large']) {
    assert(ctx.filteredCollect('', 'all', size, 'all', false, 'recent').every(a => a.size === size));
  }
  for (const color of ['blue', 'purple', 'red']) {
    assert(ctx.filteredCollect('', 'all', 'all', color, false, 'recent').every(a => a.colors.includes(color)));
  }
  ctx.artworkDetail(art.slug);
  assert(node('main').innerHTML.includes(art.title));
  assert(node('main').innerHTML.includes(art.url));
  assert(node('main').innerHTML.includes('Share on WhatsApp'));
  assert.equal(node('#room-stage').style.aspectRatio, '400/280');
  ctx.updateRoom(art, 500);
  assert.equal(node('#wall-output').textContent, '5.0 m');

  const portfolio = data.metaphysical.images[0];
  ctx.artworkDetail(portfolio.slug);
  assert(node('main').innerHTML.includes(portfolio.caption));
  ctx.openViewer();
  assert(node('#lightbox').open);
  assert.equal(node('#full-image').src, '/' + portfolio.image);
  node('#viewer-wall-width').value='400';node('#viewer-art-width').value='121.9';ctx.setViewerMode('room');
  assert.equal(node('.viewer-image').hidden, true);
  assert.equal(node('#viewer-room').hidden, false);
  assert(node('#viewer-room').innerHTML.includes('width:' + 100 / portfolio.previewCrop[2] + '%'));
  ctx.setViewerMode('artwork');
  assert.equal(node('.viewer-image').hidden, false);
  const unknown = ctx.viewerRoomArtwork({ caption: 'Artwork without dimensions', width: 600, height: 400 });
  assert(unknown.estimatedWidth);
  assert.equal(unknown.artRatio, 1.5);
  const wa = new URL(ctx.whatsappURL(portfolio));
  assert.equal(wa.hostname, 'wa.me');
  assert(wa.searchParams.get('text').endsWith(ctx.location.origin + portfolio.page));

  node('#collect-search').value = '';
  for (const key of ['category', 'size', 'color']) node('#collect-' + key).value = 'all';
  node('#collect-sort').value = 'recent';
  ctx.toggleSavedArtwork(art.slug);
  assert.equal(ctx.filteredCollect('', 'all', 'all', 'all', true, 'recent').length, 1);
  assert(JSON.parse(storage.get('carla-fache-favorites')).includes(art.slug));
  ctx.toggleSavedArtwork(art.slug);
  assert.equal(ctx.filteredCollect('', 'all', 'all', 'all', true, 'recent').length, 0);

  vm.runInContext("displayCurrency='USD'", ctx);
  assert.equal(ctx.shopPrice({ price: 1000 }), 'US$1,000');
  vm.runInContext("displayCurrency='EUR'", ctx);
  assert.equal(ctx.shopPrice({ price: 1000 }), '≈ €892.44');
  vm.runInContext("displayCurrency='CLP'", ctx);
  assert.equal(ctx.shopPrice({ price: 1000 }), '≈ $978.602');
  assert(ctx.currencyNote().includes('Oct 11, 2026'));
  assert.equal(art.price, 10000);
  ctx.location.pathname='/artworks/'+portfolio.slug;ctx.route();assert(node('main').innerHTML.includes(portfolio.caption));ctx.location.pathname='/artworks/'+art.slug+'.html';ctx.route();assert(node('main').innerHTML.includes(art.title));
  assert.equal(ctx.dimensionText('25.4 × 50.8 cm'), '25.4 × 50.8 cm');
  assert.equal(ctx.dimensionText('10 × 20 inches'), '25.4 × 50.8 cm');
  assert.equal(ctx.wallLength(400), '4.0 m');
  const titlesBefore = data.collect.images.map(a => a.title);
  const changeUnits = listeners.filter(([type]) => type === 'change').map(([,fn]) => fn);
  const event = {target: {matches: selector => selector === '[data-measurements]', value: 'imperial'}};
  changeUnits.forEach(fn => fn(event));
  assert.equal(storage.get('carla-fache-measurements'), 'imperial');
  assert.equal(ctx.dimensionText('25.4 × 50.8 cm'), '10 × 20 in');
  assert.equal(ctx.dimensionText('10 × 20 inches'), '10 × 20 in');
  assert.equal(ctx.wallLength(304.8), '10.0 ft');
  assert.equal(ctx.artworkLength(25.4), '10 in');
  assert(ctx.collectCard(art).includes(ctx.dimensionText(art.dimensions)));
  assert(ctx.sizeOptions().includes('47.2 in'));
  assert.deepEqual(data.collect.images.map(a => a.title), titlesBefore);
  event.target.value = 'metric'; changeUnits.forEach(fn => fn(event));
  assert.equal(storage.get('carla-fache-measurements'), 'metric');
  assert.equal(ctx.dimensionText('25.4 × 50.8 cm'), '25.4 × 50.8 cm');
  const inquiry = ctx.inquiryLinks(art);
  const gmail = new URL(inquiry.gmail);
  assert.equal(gmail.hostname, 'mail.google.com');
  assert.equal(gmail.searchParams.get('to'), 'contact@carlafache.com');
  assert(gmail.searchParams.get('su').includes(art.title));
  assert(gmail.searchParams.get('body').includes(ctx.location.origin + art.page));
  const selection = ctx.selectionURL([art.slug, art.slug, 'unknown']);
  assert.deepEqual([...ctx.sharedSelectionSlugs(new URL(selection).hash)], [art.slug]);
  assert.equal(ctx.sharedSelectionSlugs('#selection=%INVALID').length, 0);
  for (const a of data.collect.images.slice(0,4)) ctx.toggleCompare(a.slug);
  assert.equal(vm.runInContext('compareSlugs.size', ctx), 3);
  ctx.comparisonPage(); assert(node('main').innerHTML.includes(art.title));
  ctx.toggleCompare(art.slug); assert.equal(vm.runInContext('compareSlugs.size', ctx), 2);
  ctx.location.hash = '#selection=' + art.slug; ctx.selectionPage();
  assert(node('main').innerHTML.includes(art.title));
  node('#collect-search').value = 'iluminado'; ctx.rememberCollect();
  node('#collect-search').value = ''; ctx.restoreCollect();
  assert.equal(node('#collect-search').value, 'iluminado');
  ctx.location.hash = ''; ctx.location.pathname = '/';
  ctx.currentImages = data.collect.images;
  vm.runInContext('currentImages=DATA.collect.images; activeIndex=0; viewerMode="artwork"', ctx);
  const touches = [{clientX:180,clientY:40}];
  node('#lightbox').events.touchstart({target:{closest:()=>true},touches});
  node('#lightbox').events.touchend({changedTouches:[{clientX:80,clientY:45}]});
  assert.equal(vm.runInContext('activeIndex',ctx),1);
  node('#lightbox').events.touchstart({target:{closest:()=>true},touches});
  node('#lightbox').events.touchend({changedTouches:[{clientX:175,clientY:180}]});
  assert.equal(vm.runInContext('activeIndex',ctx),1);
  const imageEvents = {}, classes = new Set(), children = [];
  const parent = {dataset:{}, style:{}, matches:()=>true,
    classList:{add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:(...xs)=>xs.forEach(x=>classes.delete(x))},
    append(child) { child.remove=()=>children.splice(children.indexOf(child),1); children.push(child); },
    querySelector:()=>children[0] || null};
  const attrs = {src:'/assets/example.webp', srcset:'/assets/example-400.webp 400w'};
  const mockImage = {dataset:{}, parentElement:parent, complete:false, naturalWidth:0,
    addEventListener:(type,fn)=>imageEvents[type]=fn, setAttribute:(key,value)=>attrs[key]=value,
    getAttribute:key=>attrs[key], removeAttribute:key=>delete attrs[key]};
  ctx.enhanceImages({querySelectorAll:()=>[mockImage]});
  assert(classes.has('image-pending')); imageEvents.error();
  assert(classes.has('image-failed')); assert.equal(parent.dataset.retryImage,'true');
  parent.querySelector = selector => selector === 'img' ? mockImage : children[0] || null;
  ctx.retryImage(parent);
  assert(mockImage.src.includes('retry=')); assert.equal(attrs.srcset,undefined);
  assert(classes.has('image-pending')); imageEvents.load();
  assert(!classes.has('image-pending')); assert(!classes.has('image-failed'));
  console.log(file + ': gallery, currency, room, sharing, units, comparison, inquiry, state, swipes and image retry passed.');
}

run('src/app.js');
run('dist/app.js');
