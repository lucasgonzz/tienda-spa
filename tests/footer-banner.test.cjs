const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const babel = require('@babel/core')
const compiler = require('vue-template-compiler')
const Vue = require('vue')
Vue.config.productionTip = false
const root = path.resolve(__dirname, '..')
function load(file) {
 const source = fs.readFileSync(path.join(root, file), 'utf8')
 const sfc = file.endsWith('.vue') ? compiler.parseComponent(source) : null
 const js = babel.transformSync(sfc ? sfc.script.content : source, {
  babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
 }).code
 const module = { exports: {} }
 const stub = { render(h) { return h('div', this.$slots.default) } }
 new Function('require', 'module', 'exports', js)(name => {
  if (name === '@/helpers/banner_link') return load('src/helpers/banner_link.js')
  if (name === 'vue-carousel') return { Carousel: stub, Slide: stub }
  return stub
 }, module, module.exports)
 if (sfc) {
  assert.deepEqual(compiler.compile(sfc.template.content).errors, [], file)
  Object.assign(module.exports.default, compiler.compileToFunctions(sfc.template.content))
  module.exports.default.components = Object.fromEntries(Object.keys(module.exports.default.components || {}).map(k => [k, stub]))
 }
 return module.exports.default || module.exports
}
const Footer = load('src/components/common/footer/Index.vue')
const Banner = load('src/components/home/components/TitleJumbotron.vue')
const { bannerLink } = load('src/helpers/banner_link.js')
function nodes(v) {
 return [v, ...(v.componentOptions ? v.componentOptions.children || [] : v.children || []).flatMap(nodes)]
}
function text(v) { return nodes(v).map(n => n.text || '').join('') }
function footer(config, extra = {}) {
 return new Vue({ ...Footer, mixins: [], data() { return {
  commerce: { email: 'original@example.com', online_configuration: config, ...extra },
  storefront_whatsapp_contacts: [], route_name: 'Home', is_mobile: false, cart_articles: [],
 } }, computed: { ...Footer.computed, categories() { return [] } } })
}
function banner(link, title = {}) {
 return new Vue({ ...Banner, data() { return { ...Banner.data(), variant_color: '#111', ancho_pantalla: 900,
  $unused: null } }, beforeCreate() {
   this.$store = Vue.observable({ state: { titles: { titles: [{ id: 1, link, ...title }], loading: false } } })
  } })
}
function image(vm) { return nodes(vm._render()).find(n => n.data && n.data.staticClass === 'title-image') }
test('U8-01 footer real: contrato viejo, vacío, inválido y ausencia de configuración conservan defaults', () => {
 for (const config of [undefined, null, {}, { footer_contacto_titulo: ' ', footer_contacto_email: '', footer_contacto_texto: null }, { footer_contacto_titulo: [], footer_contacto_email: {}, footer_contacto_texto: [] }]) {
  const vm = footer(config)
  const tree = vm._render()
  assert.match(text(tree), /Contactanos/)
  assert.equal(nodes(tree).find(n => n.tag === 'a').data.attrs.href, 'mailto:original@example.com')
  assert.equal(nodes(tree).some(n => n.data && n.data.staticClass === 'site-footer__text'), false)
  vm.$destroy()
 }
})
test('U8-02 footer real: texto plano escapado, multilineal y mail propio sin alterar contactos existentes', () => {
 const payload = '<img src=x onerror=alert(1)>\nSegunda línea'
 const vm = footer({ footer_contacto_titulo: '<b>Ventas</b>', footer_contacto_texto: payload, footer_contacto_email: 'ventas@example.com' })
 const tree = vm._render()
 assert.match(text(tree), /<b>Ventas<\/b>/)
 const block = nodes(tree).find(n => n.data && n.data.staticClass === 'site-footer__text')
 assert.equal(text(block), payload)
 assert.ok(nodes(tree).every(n => !(n.data && n.data.domProps && n.data.domProps.innerHTML)))
 assert.equal(nodes(tree).find(n => n.tag === 'a').data.attrs.href, 'mailto:ventas@example.com')
 vm.commerce.online_configuration.footer_contacto_email = 'a@example.com?bcc=otro@example.com'
 assert.equal(nodes(vm._render()).find(n => n.tag === 'a').data.attrs.href, 'mailto:original@example.com')
 vm.$destroy()
})
test('U8-03 enlace: rechaza esquemas, controles, credenciales y rutas ambiguas incluso codificados', () => {
 for (const link of [undefined, null, {}, [], 2, '', ' ', 'javascript:alert(1)', 'data:text/html,x', 'mailto:a@b.com', '//evil.test', '\\evil.test', '/%2fevil.test', '/%255cevil.test', 'https://@evil.test', 'https://:@evil.test', 'https://u:p@evil.test', 'https://u%40evil.test@x.test', 'https://x.test/%0a', '/x\t', '/x%7f', '/a/../x', '/%252e%252e/x', 'javascript%3aalert(1)', 'ftp://x.test', '/x%zz', 'x'.repeat(501)]) {
  assert.equal(bannerLink(link), null, String(link))
  const vm = banner(link)
  const node = image(vm)
  assert.equal(node.tag, 'div', String(link))
  assert.equal(node.data.attrs.href, null)
  vm.$destroy()
 }
})
test('U8-04 componente real: enlaces internos normalizados y externos nativos accesibles, sin perder contenido', () => {
 for (const [link, href, external] of [['catalogo?x=1#f', '/catalogo?x=1#f', false], ['/ofertas', '/ofertas', false], ['https://example.com/p', 'https://example.com/p', true], ['HTTP://example.com/p', 'http://example.com/p', true]]) {
  const vm = banner(link, { header: 'Ofertas', lead: 'Hoy', image_url: 'imagen.jpg' })
  const node = image(vm)
  assert.equal(node.tag, 'a')
  assert.equal(node.data.attrs.href, href)
  assert.equal(node.data.attrs.target, external ? '_blank' : null)
  assert.equal(node.data.attrs.rel, external ? 'noopener noreferrer' : null)
  assert.match(node.data.attrs['aria-label'], external ? /Ofertas.*pestaña nueva/ : /^Ofertas$/)
  assert.match(text(node), /Ofertas/)
  assert.equal(nodes(node).find(n => n.tag === 'img').data.attrs.draggable, false)
  vm.$destroy()
 }
 const vm = banner('/ofertas')
 assert.equal(image(vm).data.attrs['aria-label'], 'Ver más')
 vm.$destroy()
})
// Eventos cancelables despachados a los handlers del template compilado real.
// EventTarget reemplaza sólo DOM/navegación: no acredita navegador ni QA visual.
function fixture() {
 const vm = banner('/ofertas')
 const node = image(vm)
 const doc = new EventTarget()
 const anchor = new EventTarget()
 anchor.ownerDocument = doc
 for (const [name, handler] of Object.entries(node.data.on)) anchor.addEventListener(name, handler)
 function dispatch(target, type, props = {}) {
  const e = new Event(type, { cancelable: true })
  for (const [k, v] of Object.entries(props)) Object.defineProperty(e, k, { value: v })
  target.dispatchEvent(e)
  return e
 }
 return { vm, doc, anchor, dispatch }
}
test('U8-05 eventos reales: click simple/teclado nativos; doble click no suma navegación', () => {
 const { vm, anchor, dispatch } = fixture()
 assert.equal(dispatch(anchor, 'click', { detail: 1, timeStamp: 1000 }).defaultPrevented, false)
 assert.equal(dispatch(anchor, 'click', { detail: 2, timeStamp: 1010 }).defaultPrevented, true)
 assert.equal(dispatch(anchor, 'click', { detail: 1, timeStamp: 1100 }).defaultPrevented, true)
 assert.equal(dispatch(anchor, 'click', { detail: 0, timeStamp: 1200 }).defaultPrevented, false)
 assert.equal(dispatch(anchor, 'click', { detail: 1, timeStamp: 2000, ctrlKey: true }).defaultPrevented, false)
 vm.$destroy()
})
test('U8-06 eventos reales: drag mouse/touch/pen y cancelación no navegan; click siguiente sí, cleanup', () => {
 for (const pointerType of ['mouse', 'touch', 'pen']) {
  for (const end of ['pointerup', 'pointercancel']) {
   const { vm, anchor, doc, dispatch } = fixture()
   const event = { clientX: 50, clientY: 50, pointerId: 7, pointerType }
   dispatch(anchor, 'pointerdown', event)
   dispatch(doc, 'pointermove', { ...event, clientX: 100 })
   dispatch(doc, end, { ...event, clientX: 100 })
   assert.equal(vm.banner_gesture, null)
   assert.equal(dispatch(anchor, 'click', { detail: 1, timeStamp: 1000 }).defaultPrevented, true)
   assert.equal(dispatch(anchor, 'auxclick', { detail: 1, timeStamp: 1001 }).defaultPrevented, true)
   dispatch(anchor, 'pointerdown', event)
   dispatch(doc, 'pointerup', event)
   assert.equal(dispatch(anchor, 'click', { detail: 1, timeStamp: 2000 }).defaultPrevented, false)
   dispatch(anchor, 'pointerdown', event)
   vm.$destroy()
   assert.equal(vm.banner_gesture, null)
   vm.banner_moved = false
   dispatch(doc, 'pointermove', { ...event, clientX: 100 })
   assert.equal(vm.banner_moved, false, 'sin listeners después de destruir')
  }
 }
})
test('U8-07 sin enlace conserva carrusel, textos, imagen, loading y contenido no interactivo', () => {
 const vm = banner(null, { header: 'Título', lead: 'Texto', image_url: 'normal.jpg', crop_image_url: 'movil.jpg' })
 assert.equal(image(vm).tag, 'div')
 assert.match(text(vm._render()), /Título/)
 let carousel = nodes(vm._render()).find(n => n.componentOptions && n.data.attrs && n.data.attrs.autoplay === '')
 assert.ok(carousel)
 assert.equal(carousel.data.attrs.autoplayTimeout, 4000)
 vm.ancho_pantalla = 360
 assert.equal(nodes(vm._render()).find(n => n.tag === 'img').data.attrs.src, 'movil.jpg')
 vm.$store.state.titles.loading = true
 assert.equal(image(vm), undefined)
 vm.$destroy()
})
