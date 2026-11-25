const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const { execFileSync } = require('node:child_process')
const babel = require('@babel/core')
const compiler = require('vue-template-compiler')
const Vue = require('vue')
const VueRouter = require('vue-router')
Vue.use(VueRouter)
Vue.config.productionTip = false
const root = path.resolve(__dirname, '..')
const viewPath = 'src/components/article/components/article-view/Index.vue'
const saberPath = 'src/components/article/components/data/SaberDelProducto.vue'
const paymentPath = 'src/views/Payment.vue'
const cache = new Map()
const tracking = { trackear() {}, TIPOS_EVENTO: {} }
function load(file) {
 if (cache.has(file)) return cache.get(file)
 const source = process.env.CC_TEST_BASE_REF
  ? execFileSync('git', ['show', process.env.CC_TEST_BASE_REF + ':' + file], { cwd: root, encoding: 'utf8' })
  : fs.readFileSync(path.join(root, file), 'utf8')
 const sfc = file.endsWith('.vue') ? compiler.parseComponent(source) : null
 const code = babel.transformSync(sfc ? sfc.script.content : source, {
  babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
 }).code
 const module = { exports: {} }
 function local(name) {
  if (name === 'vue') return Vue
  if (name === 'vue-router') return VueRouter
  if (name === 'vue-router-back-button') return { install() {} }
  if (name === '@/utils/tracking') return tracking
  if (name === '@/helpers/descripcion_articulo') return load('src/helpers/descripcion_articulo.js')
  if (name === '@/helpers/direcciones') return { direcciones_activas() { return false } }
  if (name === '@/helpers/consultas_de_stock') return { carrito_a_consultar() { return false } }
  if (name.endsWith('/Payment.vue')) return Payment
  return { render: h => h('div') }
 }
 new Function('require', 'module', 'exports', code)(local, module, module.exports)
 if (sfc) {
  const component = module.exports.default
  Object.keys(component.components || {}).forEach(name => {
   component.components[name] = { name, render: h => h('div') }
  })
  const result = compiler.compile(sfc.template.content)
  assert.deepEqual(result.errors, [], file)
  Object.assign(module.exports.default, compiler.compileToFunctions(sfc.template.content))
 }
 cache.set(file, module.exports)
 return module.exports
}
const View = load(viewPath).default
const Saber = load(saberPath).default
const Payment = load(paymentPath).default
function nodes(node) {
 return [node, ...(node.children || []).flatMap(nodes)]
}
function articleView(modal, article) {
 return new Vue({ ...View,
  beforeCreate() { Object.defineProperty(this, '$route', { value: { name: 'Article' } }); this.$store = { state: { articles: { article_to_show: article } } } },
  computed: { ...View.computed, esta_en_modal() { return modal } },
 })
}
test('U4-01 descripción completa bajo datos/compra y antes de relacionados, sin duplicación en Article', () => {
 const vm = articleView(false, { description: 'Descripción de prueba' })
 const tree = nodes(vm._render())
 const section = tree.find(n => n.tag === 'section')
 assert.equal(section.data.attrs.id, 'descripcion-completa')
 const card = tree.find(n => n.data && n.data.staticClass === 'ficha-ml__tarjeta')
 const children = card.children.filter(n => n.tag)
 assert.equal(children[0].data.staticClass, 'ficha-ml__cuerpo')
 assert.equal(children[1], section)
 // La última posición es el componente async de relacionados (comentario placeholder).
 assert.ok(card.children.indexOf(section) < card.children.findIndex(n => n.componentOptions && n.componentOptions.Ctor.options.name === 'Relacionados'))
 assert.equal(tree.filter(n => n.componentOptions && n.componentOptions.Ctor.options.name === 'Description').length, 1)
 const source = fs.readFileSync(path.join(root, 'src/views/Article.vue'), 'utf8')
 const template = compiler.parseComponent(source).template.content
 assert.doesNotMatch(template, /<description|descripcion-completa/)
 vm.$destroy()
})
test('U4-02 ficha y modal simultáneos no duplican ID; sin descripción no hay bloque vacío', () => {
 for (const description of [{ description: 'Texto' }, { descriptions: [{ id: 1, title: 'Detalle', content: 'Texto' }] }]) {
  const ficha = articleView(false, description)
  const modal = articleView(true, description)
  const sections = [ficha, modal].flatMap(vm => nodes(vm._render()).filter(n => n.tag === 'section'))
  assert.equal(sections.length, 2)
  assert.equal(sections.filter(n => n.data.attrs.id === 'descripcion-completa').length, 1)
  ficha.$destroy(); modal.$destroy()
 }
 for (const article of [null, {}, { description: '' }]) {
  const vm = articleView(false, article)
  assert.equal(nodes(vm._render()).filter(n => n.tag === 'section').length, 0)
  vm.$destroy()
 }
})
test('U4-03 Ver características sólo mueve la ficha, nunca el fondo desde modal', () => {
 const calls = []
 global.document = { getElementById(id) { assert.equal(id, 'descripcion-completa'); return { scrollIntoView: opts => calls.push(opts) } } }
 Saber.methods.ver_caracteristicas.call({ esta_en_modal: false })
 Saber.methods.ver_caracteristicas.call({ esta_en_modal: true })
 assert.deepEqual(calls, [{ behavior: 'smooth', block: 'start' }])
 global.document.getElementById = () => null
 assert.doesNotThrow(() => Saber.methods.ver_caracteristicas.call({ esta_en_modal: false }))
 delete global.document
})
// Vue sin navegador no parchea DOM. Conservamos Vue/Router, hooks de VNode y
// templates reales; sólo el elemento del ref es un doble de DOM. No acredita QA visual.
// Datos globales que usa Payment en la aplicación; sin servicios ni compradores reales.
Vue.mixin({
 computed: { commerce() { return { online_configuration: {} } }, authenticated() { return false } },
 methods: { setTitle() {}, flag_activo() { return false } },
})
Vue.prototype.$store = { state: { cart: { cart: {}, buyer: {} } }, commit() {} }
test('U4-04 navegación real Article → Payment: foco sólo tras montaje y nextTick; volver y reentrar funciona', async () => {
 const router = load('src/router/index.js').default
 const calls = []
 const instances = []
 const app = new Vue({ router, render: h => h('router-view') })
 // Parche mínimo de VNode: Vue mantiene el activeInstance y Router registra la
 // instancia de ruta por el mismo camino que en navegador. El DOM es el único doble.
 app.__patch__ = (old, vnode) => {
  if (old && old.componentInstance) old.componentInstance.$destroy()
  if (vnode && vnode.componentOptions) {
   vnode.data.hook.init(vnode, false)
   const vm = vnode.componentInstance
   if (vm.$options.mounted && router.currentRoute.name === 'Payment') {
    vm.$refs.inicio_checkout = {
     focus(options) { calls.push(['focus', options]) },
     scrollIntoView(options) { calls.push(['scroll', options]) },
    }
    const before = calls.length
    vnode.data.hook.insert(vnode)
    assert.equal(calls.length, before, 'no enfoca sin esperar nextTick')
    instances.push(vm)
   } else vnode.data.hook.insert(vnode)
  }
  return { render: h => h('div') }
 }
 app.$mount()
 await router.push('/articulos/prueba/1')
 const navigation = router.push({ name: 'Payment' })
 assert.deepEqual(calls, [])
 await navigation
 await Vue.nextTick()
 assert.deepEqual(calls, [['focus', { preventScroll: true }], ['scroll', { behavior: 'auto', block: 'start' }]])
 const vm = instances[0]
 assert.equal(vm.$options.render, Payment.render)
 const heading = nodes(vm._render()).find(n => n.tag === 'h1')
 assert.equal(heading.data.ref, 'inicio_checkout')
 assert.equal(heading.data.attrs.tabindex, '-1')
 await router.push({ name: 'Cart' })
 assert.equal(calls.length, 2)
 const stop = router.beforeEach((to, from, next) => next(false))
 await assert.rejects(router.push({ name: 'Payment' }))
 assert.equal(calls.length, 2, 'una navegación cancelada no monta ni enfoca')
 stop()
 calls.length = 0
 await router.push({ name: 'Payment' })
 await Vue.nextTick()
 assert.equal(calls.length, 2)
 assert.equal(instances.length, 2)
 router.back()
 await Vue.nextTick()
 assert.equal(router.currentRoute.name, 'Cart')
 assert.equal(calls.length, 2)
 router.forward()
 await Vue.nextTick()
 assert.equal(calls.length, 4, 'adelante vuelve a enfocar al montar')
 assert.equal(instances.length, 3)
 instances[2].$destroy(); app.$destroy()
 // No se instala restauración global para las demás rutas.
 assert.equal(router.options.scrollBehavior, undefined)
})
test('U4-05 abandonar o destruir checkout antes del tick no mueve otra pantalla', async () => {
 for (const destroyed of [true, false]) {
  const calls = []
  const vm = new Vue({ ...Payment, beforeCreate() { Object.defineProperty(this, '$route', { value: { name: 'Payment' } }) } }).$mount()
  vm.$refs.inicio_checkout = { focus() { calls.push('focus') }, scrollIntoView() { calls.push('scroll') } }
  if (destroyed) vm.$destroy()
  else vm.$route.name = 'Cart'
  await Vue.nextTick()
  assert.deepEqual(calls, [])
  if (!destroyed) vm.$destroy()
 }
})
test('U4-06 el inicio del checkout descuenta la altura real del nav fijo y deja un margen', async () => {
 // Casos: nav de distinta altura (celular / escritorio) y sin nav (se comporta como antes).
 const casos = [
  { alto_nav: 64, esperado: '74px' },
  { alto_nav: 110, esperado: '120px' },
  { alto_nav: null, esperado: '' },
 ]
 for (const caso of casos) {
  const calls = []
  global.document = {
   querySelector(selector) {
    assert.equal(selector, '.cont-nav')
    return caso.alto_nav === null ? null : { getBoundingClientRect() { return { height: caso.alto_nav } } }
   },
  }
  const vm = new Vue({ ...Payment, beforeCreate() { Object.defineProperty(this, '$route', { value: { name: 'Payment' } }) } }).$mount()
  // El doble del encabezado expone style como el DOM real; el margen se mide en el momento.
  vm.$refs.inicio_checkout = {
   style: {},
   focus(options) { calls.push(['focus', options]) },
   scrollIntoView(options) { calls.push(['scroll', options, this.style.scrollMarginTop || '']) },
  }
  await Vue.nextTick()
  assert.deepEqual(calls, [
   ['focus', { preventScroll: true }],
   ['scroll', { behavior: 'auto', block: 'start' }, caso.esperado],
  ])
  vm.$destroy()
  delete global.document
 }
})
