const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const sanitizer = source.match(/function clean\(s\) \{[\s\S]*?\n\}/)[0];
function element(tag, attrs = {}) {
  return {tagName: tag, childNodes: [], attrs: {...attrs}, removed: false,
    get attributes() {return Object.keys(this.attrs).map(name => ({name}));},
    getAttribute(name) {return this.attrs[name];},
    removeAttribute(name) {delete this.attrs[name];},
    setAttribute(name, value) {this.attrs[name] = value;},
    remove() {this.removed = true;}, replaceWith() {this.removed = true;}};
}
for (const href of ['javascript:alert(1)', 'data:text/html,test', 'https://example.com/\nattack', '//example.com', 'http://example.com']) {
  const anchor = element('A', {href, onclick: 'alert(1)', style: 'color:red'});
  const script = element('SCRIPT');
  const template = {innerHTML: '', content: {querySelectorAll(selector) {return selector === '*' ? [anchor] : [script];}}};
  const ctx = {document: {createElement() {return template;}}};
  vm.createContext(ctx); vm.runInContext(sanitizer, ctx); ctx.clean('test');
  assert(script.removed); assert.equal(anchor.attrs.href, undefined);
  assert.equal(anchor.attrs.onclick, undefined); assert.equal(anchor.attrs.style, undefined);
}
for (const href of ['https://www.artsy.net/artist/carla-fache', 'mailto:contact@carlafache.com']) {
  const anchor = element('A', {href});
  const ctx = {document: {createElement() {return {innerHTML: '', content: {querySelectorAll(s) {return s === '*' ? [anchor] : [];}}};}}};
  vm.createContext(ctx); vm.runInContext(sanitizer, ctx); ctx.clean('test');
  assert.equal(anchor.attrs.href, href); assert.equal(anchor.attrs.rel, 'noopener noreferrer');
}
const headers = fs.readFileSync(path.join(root, 'dist/_headers'), 'utf8');
assert(headers.includes("script-src 'self'; script-src-attr 'none'"));
assert(!/script-src[^;]*unsafe/.test(headers));
for (const directive of ["frame-ancestors 'none'", "base-uri 'none'", "object-src 'none'", 'https://open.er-api.com']) assert(headers.includes(directive));
assert(headers.split('\n').every(line => line.length < 2000));
console.log('Security policy and sanitizer attack fixtures passed.');
