const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { test } = require('node:test')
const babel = require('@babel/core')
const Vue = require('vue')
const Vuex = require('vuex')
const axios = require('axios')

Vue.use(Vuex)
Vue.config.productionTip = false
Vue.prototype.$toast = { error() {}, warning() {}, success() {} }
const raiz = path.resolve(__dirname, '..')
const cache = new Map()
function cargar(nombre) {
	if (nombre === 'vue-load-image') return {}
	if (nombre === '@/utils/tracking') return { trackear() {}, TIPOS_EVENTO: {} }
	if (!nombre.startsWith('@/') && !path.isAbsolute(nombre)) return require(nombre)
	let archivo = nombre.startsWith('@/') ? path.join(raiz, 'src', nombre.slice(2)) : nombre
	if (!path.extname(archivo)) archivo += fs.existsSync(archivo + '.js') ? '.js' : '.vue'
	if (cache.has(archivo)) return cache.get(archivo).exports
	let fuente = fs.readFileSync(archivo, 'utf8')
	const relativo = path.relative(raiz, archivo).split(path.sep).join('/')
	if (process.env.CC_TEST_BASE_REF && ['src/store/cart.js', 'src/mixins/articles.js'].includes(relativo)) {
		fuente = execFileSync('git', ['show', process.env.CC_TEST_BASE_REF + ':' + relativo], { cwd: raiz, encoding: 'utf8' })
	}
	if (archivo.endsWith('.vue')) fuente = require('vue-template-compiler').parseComponent(fuente).script.content
	const codigo = babel.transformSync(fuente, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code
	const modulo = { exports: {} }
	cache.set(archivo, modulo)
	new Function('require', 'module', 'exports', codigo)(cargar, modulo, modulo.exports)
	return modulo.exports
}
const Cart = cargar('@/store/cart').default
const Articles = cargar('@/store/articles/articles').default
const Add = cargar('@/components/article/components/data/add-to-cart/Index.vue').default
const Selector = cargar('@/components/common/article-card/SelectorCompra.vue').default
const Btn = cargar('@/components/common/article-card/body/BtnMasInfo.vue').default
const generals = cargar('@/mixins/generals').default.methods
const helpers = cargar('@/helpers/compra_desde_tarjeta')
function caso({ auth = false, amount = 1, stock = 10, variantes = [], config = {}, consultar = false } = {}) {
 const article = { id: 1, name: 'Prueba', slug: 'prueba', images: [], final_price: 100, stock, article_variants: variantes, article_properties: [], online: 1, status: 'active' }
 const commerce = { consultas_de_stock: consultar, online_configuration: config }
 const store = new Vuex.Store({ modules: {
  cart: { ...Cart, state: JSON.parse(JSON.stringify(Cart.state)) },
  articles: { ...Articles, state: { ...Articles.state, article_to_show: article, amount } },
  auth: { namespaced: true, mutations: { setMessage() {}, setLoading() {} } },
 } })
 const opts = {
  store, propsData: { article },
  computed: { authenticated() { return auth }, puede_comprar_sin_login() { return true }, commerce() { return commerce } },
  methods: { ...generals, puede_ver_precios() { return true }, commerce_has_extencion() { return false }, price(n) { return String(n) }, ajustes_de_cliente() { return [] }, factor_de_ajustes() { return 1 } },
 }
 const vm = new Vue({ ...opts, extends: Add })
 vm.$toast = { error() {}, warning() {}, success() {} }
 vm.$bvModal = { hide() {} }
 return { vm, store, article, opts }
}
function adapter(t, callback) {
 const old = axios.defaults.adapter
 t.after(() => { axios.defaults.adapter = old })
 axios.defaults.adapter = config => Promise.resolve(callback(JSON.parse(config.data), config)).then(data => ({ data, config, status: 200, statusText: 'OK', headers: {} }))
}
test('invitado simple usa alta común, precio por cantidad real y toggle protegido', async () => {
 const { vm, store, article } = caso({ amount: 3 })
 article.article_price_ranges = [{ amount: 3, modo: 'Mayor o igual', price: 80 }]
 assert.equal(await vm.saveCart(), true)
 assert.equal(store.state.cart.cart.articles.length, 1)
 assert.equal(store.state.cart.cart.articles[0].pivot.price, 80)
 assert.equal(await vm.saveCart(), false)
 assert.equal(store.state.cart.cart.articles.length, 1)
})
test('logueado guarda por action real, acepta precio autoritativo y no duplica doble click', async t => {
 const { vm, store } = caso({ auth: true })
 let resolver, requests = 0
 adapter(t, payload => { requests++; return new Promise(resolve => { resolver = () => resolve({ cart: { ...payload.cart, id: 44, articles: payload.cart.articles.map(a => ({ ...a, pivot: { ...a.pivot, price: 73 } })) } }) }) })
 const pending = vm.saveCart()
 assert.equal(await vm.saveCart(), false)
 await new Promise(resolve => setImmediate(resolve))
 assert.equal(requests, 1)
 resolver()
 assert.equal(await pending, true)
 assert.equal(vm.saving, false)
 assert.equal(store.state.cart.cart.articles[0].pivot.price, 73)
})
test('error genérico o consulta stock revierte alta propia y conserva otras líneas', async t => {
 for (const codigo of [null, 'consulta_stock']) {
  const { vm, store } = caso({ auth: true })
  store.commit('cart/addItem', { id: 9, pivot: { amount: 2, price: 20 } })
  adapter(t, () => Promise.reject({ response: { data: { codigo, message: '<falló>' } } }))
  assert.equal(await vm.saveCart(), false)
  assert.deepEqual(store.state.cart.cart.articles.map(a => a.id), [9])
  assert.equal(vm.saving, false)
  assert.equal(store.state.articles.amount, 1)
 }
})
test('descarte servidor por lista nunca muestra agregado', async t => {
 const { vm, store } = caso({ auth: true })
 adapter(t, () => ({ cart: { id: 44, articles: [], promociones_vinoteca: [], combos: [] }, articulos_no_disponibles: [{ id: 1, name: 'Prueba' }] }))
 assert.equal(await vm.saveCart(), false)
 assert.equal(store.state.cart.cart.articles.length, 0)
 assert.equal(store.state.cart.added_item_popup_visible, false)
})
test('variantes requeridas siempre, nunca arbitrarias; stock elegido y consulta', async () => {
 for (const auth of [false, true]) {
  const c = caso({ auth, stock: 99, variantes: [{ id: 2, stock: 0 }, { id: 3, stock: 2 }] })
  assert.equal(await c.vm.saveCart(), false)
  c.store.commit('articles/setSelectedArticleVariant', c.article.article_variants[0])
  assert.equal(await c.vm.saveCart(), false)
  c.store.commit('articles/setSelectedArticleVariant', { id: 99, stock: 99 })
  assert.equal(await c.vm.saveCart(), false)
  assert.equal(c.store.state.cart.cart.articles.length, 0)
 }
 const c = caso({ consultar: true, variantes: [{ id: 2, stock: 0 }] })
 c.store.commit('articles/setSelectedArticleVariant', c.article.article_variants[0])
 assert.equal(await c.vm.saveCart(), true)
 assert.equal(c.store.state.cart.cart.articles[0].pivot.variant_id, 2)
})
test('cantidades finitas enteras, stock insuficiente, precio oculto y pausado', async () => {
 for (const amount of ['', 0, -1, 1.5, Infinity, NaN, 11]) {
  const c = caso({ amount })
  assert.equal(await c.vm.saveCart(), false, String(amount))
  assert.equal(c.store.state.cart.cart.articles.length, 0)
 }
 for (const cambio of [{ precio_pausado: 1 }, { final_price: null }, { final_price: 0 }]) {
  const c = caso(); Object.assign(c.article, cambio)
  assert.equal(await c.vm.saveCart(), false)
 }
 const c = caso(); c.vm.puede_ver_precios = () => false
 assert.equal(await c.vm.saveCart(), false)
})
test('sin cantidad predeterminada abre selector; preferencia >1 se preserva, no inventa mínimo', () => {
 assert.equal(helpers.requiere_selector({ article_variants: [] }, {}), true)
 assert.equal(helpers.cantidad_inicial({ default_amount_add_to_cart: 3 }), 3)
 assert.equal(helpers.requiere_selector({ article_variants: [] }, { default_amount_add_to_cart: 3 }), false)
 assert.equal(helpers.requiere_selector({ article_variants: [{ id: 2 }] }, { default_amount_add_to_cart: 3 }), true)
})
test('cancelar restaura selección, notas y cantidad sin tocar carrito ni tarjeta', () => {
 const c = caso({ amount: 4 })
 c.store.commit('articles/setNotes', 'anteriores')
 const original = JSON.stringify(c.article)
 const selector = new Vue({ ...c.opts, extends: Selector })
 assert.notEqual(selector.compra, c.article)
 let cerrado = 0; selector.$on('terminar', () => cerrado++)
 c.store.commit('articles/setAmount', 5)
 selector.terminar()
 assert.equal(cerrado, 1)
 assert.equal(c.store.state.articles.amount, 4)
 assert.equal(c.store.state.articles.notes, 'anteriores')
 assert.equal(c.store.state.articles.article_to_show, c.article)
 assert.equal(JSON.stringify(c.article), original)
 assert.equal(c.store.state.cart.cart.articles.length, 0)
 selector.$destroy()
})
test('tarjeta simple ejecuta alta directa y libera bloqueo de otras tarjetas', async () => {
 const c = caso({ config: { default_amount_add_to_cart: 2 } })
 const btn = new Vue({ ...c.opts, extends: Btn })
 btn.add_to_cart(); btn.add_to_cart()
 assert.equal(btn.comprando, true)
 const selector = new Vue({ ...c.opts, extends: Selector })
 selector.$refs.guardar = c.vm
 await Vue.nextTick()
 await new Promise(resolve => setImmediate(resolve))
 assert.equal(c.store.state.cart.cart.articles.length, 1)
 assert.equal(c.store.state.cart.cart.articles[0].amount, 2)
 selector.$destroy()
 assert.equal(helpers.tomar_compra(c.store), true)
 helpers.soltar_compra(c.store)
})
test('templates reales compilan e imagen detiene propagación y navega a ficha', () => {
 const compiler = require('vue-template-compiler')
 for (const file of ['common/article-card/body/BtnMasInfo', 'common/article-card/ArticleImage', 'common/article-card/SelectorCompra', 'article/components/data/add-to-cart/Index']) {
  const source = fs.readFileSync(path.join(raiz, 'src/components', file + '.vue'), 'utf8')
  const desc = compiler.parseComponent(source)
  assert.deepEqual(compiler.compile(desc.template.content).errors, [], file)
 }
 const image = fs.readFileSync(path.join(raiz, 'src/components/common/article-card/ArticleImage.vue'), 'utf8')
 assert.match(image, /@click.prevent.stop="toArticle\(article\)"/)
})
test('controles de variantes reales eligen la combinación explícita y conservan otra variante', async t => {
 const Variants = cargar('@/components/article/components/data/Variants.vue').default
 const values = [{ id: 7, name: 'Rojo', article_property_type: { name: 'Color' } }, { id: 8, name: 'Azul', article_property_type: { name: 'Color' } }]
 for (const auth of [false, true]) {
  const c = caso({ auth, variantes: values.map((v, i) => ({ id: i + 2, stock: 5, article_property_values: [v] })) })
  const property = { id: 1, article_property_type: { name: 'Color' }, article_property_values: values }
  c.article.article_properties = [property]
  c.store.commit('articles/setArticleToShow', c.article)
  c.store.commit('cart/addItem', { id: 1, variant_id: 3, pivot: { amount: 1, price: 100, variant_id: 3 } })
  const control = new Vue({ ...c.opts, extends: Variants })
  assert.equal(c.store.state.articles.selected_article_variant, null)
  control.elegir(property, values[0])
  assert.equal(c.store.state.articles.selected_article_variant.id, 2)
  if (auth) adapter(t, payload => ({ cart: { ...payload.cart, id: 44 } }))
  assert.equal(await c.vm.saveCart(), true)
  assert.deepEqual(c.store.state.cart.cart.articles.map(a => a.pivot.variant_id), [3, 2])
  control.$destroy()
 }
})
