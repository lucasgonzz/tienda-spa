/*
 * Misión tienda-articulos-sin-slug (CA9-CA11): un artículo sin slug abre igual su ficha usando el
 * segmento `~<id>` (contrato §2.1 del plan). Se cargan los archivos REALES con babel, igual que
 * tests/compra-desde-tarjeta.test.cjs; los componentes pesados se reemplazan por stubs vacíos.
 */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const babel = require('@babel/core')
const Vue = require('vue')
const Vuex = require('vuex')
const axios = require('axios')

Vue.use(Vuex)
Vue.config.productionTip = false
// Id del comercio que leen todos los armadores de URL (runtime_config cae a process.env)
process.env.VUE_APP_COMMERCE_ID = '44700'
// Compartir.vue lee window.location.origin como base pública
global.window = { location: { origin: 'https://mitienda.test' } }

const raiz = path.resolve(__dirname, '..')
const cache = new Map()
// Componentes que sí se cargan reales (el resto de @/components/* son stubs)
const REALES = ['@/components/article/components/data/Compartir.vue', '@/components/promocion-personalizada/Index.vue']
function cargar(nombre) {
	if (nombre === 'vue-load-image') return {}
	if (nombre === '@/utils/tracking') return { trackear() {}, TIPOS_EVENTO: {}, abrir_vista_de_producto() {}, cerrar_vista() {} }
	if (nombre === '@/utils/seo_servidor') return { seo_servidor() {} }
	if (nombre.startsWith('@/components/') && !REALES.includes(nombre)) return { default: {} }
	if (!nombre.startsWith('@/') && !path.isAbsolute(nombre)) return require(nombre)
	let archivo = nombre.startsWith('@/') ? path.join(raiz, 'src', nombre.slice(2)) : nombre
	if (!path.extname(archivo)) archivo += fs.existsSync(archivo + '.js') ? '.js' : '.vue'
	if (cache.has(archivo)) return cache.get(archivo).exports
	let fuente = fs.readFileSync(archivo, 'utf8')
	if (archivo.endsWith('.vue')) fuente = require('vue-template-compiler').parseComponent(fuente).script.content
	const codigo = babel.transformSync(fuente, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code
	const modulo = { exports: {} }
	cache.set(archivo, modulo)
	new Function('require', 'module', 'exports', codigo)(cargar, modulo, modulo.exports)
	return modulo.exports
}

// Router espía: guarda lo que se empuja y arma hrefs con la forma real de la ruta
function router_espia() {
	const empujes = []
	return {
		empujes,
		push(location) { empujes.push(location); return Promise.resolve() },
		resolve(location) { return { href: '/articulos/' + location.params.slug + '/' + location.params.commerce_id } },
	}
}
const sin_slug = { id: 823, slug: null, name: 'Reel Surfish Flash 2000', images: [] }

test('CA9: segmento_de_ficha aplica la regla slug o ~id', () => {
	const { segmento_de_ficha } = cargar('@/helpers/segmento_ficha')
	assert.equal(segmento_de_ficha({ slug: 'abc', id: 5 }), 'abc')
	assert.equal(segmento_de_ficha({ slug: null, id: 823 }), '~823')
	assert.equal(segmento_de_ficha({ slug: '', id: 823 }), '~823')
	assert.equal(segmento_de_ficha({ slug: '  ', id: 1 }), '~1')
	assert.equal(segmento_de_ficha({ slug: null }), null)
	assert.equal(segmento_de_ficha(null), null)
})

test('CA10: toArticle empuja ~id para un artículo sin slug y los params de hoy con slug', () => {
	const mixin = cargar('@/mixins/articles').default.methods
	for (const [article, esperado] of [[sin_slug, '~823'], [{ id: 5, slug: 'abc' }, 'abc']]) {
		const $router = router_espia()
		const contexto = { $store: { commit() {} }, $router, $scrollToTop() {}, set_amount_add_to_cart() {} }
		mixin.toArticle.call(contexto, article)
		assert.deepEqual($router.empujes, [{ name: 'Article', params: { slug: esperado, commerce_id: '44700' } }])
	}
})

test('CA10: toArticle sin id ni slug no navega y deja console.warn', t => {
	const mixin = cargar('@/mixins/articles').default.methods
	const warn = t.mock.method(console, 'warn', () => {})
	const $router = router_espia()
	mixin.toArticle.call({ $store: { commit() {} }, $router, $scrollToTop() {}, set_amount_add_to_cart() {} }, { slug: null })
	assert.equal($router.empujes.length, 0)
	assert.equal(warn.mock.calls.length >= 1, true)
})

test('CA10: href_articulo de un artículo sin slug es /articulos/~823/<comercio>', () => {
	const { href_articulo } = cargar('@/mixins/seo').default.methods
	const contexto = { $router: router_espia() }
	assert.equal(href_articulo.call(contexto, sin_slug), '/articulos/~823/44700')
	assert.equal(href_articulo.call(contexto, { id: 1, slug: 'abc' }), '/articulos/abc/44700')
})

test('CA10: getArticleToShow con ~823 pide /api/articles/~823/<comercio>', async t => {
	const Articles = cargar('@/store/articles/articles').default
	const store = new Vuex.Store({ modules: { articles: { ...Articles, state: { ...Articles.state } } } })
	const viejo = axios.defaults.adapter
	t.after(() => { axios.defaults.adapter = viejo })
	let url = null
	axios.defaults.adapter = config => { url = config.url; return Promise.resolve({ data: { article: sin_slug }, config, status: 200, statusText: 'OK', headers: {} }) }
	await store.dispatch('articles/getArticleToShow', { slug: '~823', commerce_id: '44700' })
	assert.equal(url.endsWith('/api/articles/~823/44700'), true)
})

test('CA11: la guarda del catch no suelta el artículo sin slug pedido por ~823', async t => {
	const Articles = cargar('@/store/articles/articles').default
	const store = new Vuex.Store({ modules: { articles: { ...Articles, state: { ...Articles.state, article_to_show: sin_slug } } } })
	const viejo = axios.defaults.adapter
	t.after(() => { axios.defaults.adapter = viejo })
	axios.defaults.adapter = () => Promise.reject(new Error('corte de red'))
	t.mock.method(console, 'log', () => {})
	await store.dispatch('articles/getArticleToShow', { slug: '~823', commerce_id: '44700' })
	assert.equal(store.state.articles.article_to_show, sin_slug)
})

test('CA11: canónica de Article.vue usa ~823 sin slug y el slug con slug', () => {
	const { seo_canonica } = cargar('@/views/Article.vue').default.computed
	const seo = cargar('@/mixins/seo').default.methods
	const con = article => seo_canonica.call({ article, seo_origen: () => 'https://mitienda.test', seo_segmento: seo.seo_segmento })
	assert.equal(con(sin_slug), 'https://mitienda.test/articulos/~823/44700')
	assert.equal(con({ id: 5, slug: 'abc' }), 'https://mitienda.test/articulos/abc/44700')
})

test('CA11: link de Compartir usa ~823 sin slug', () => {
	const { get_article_public_url } = cargar('@/components/article/components/data/Compartir.vue').default.methods
	const url = article => get_article_public_url.call({ article, $route: { params: {} }, $router: router_espia() })
	assert.equal(url(sin_slug).endsWith('/articulos/~823/44700'), true)
	assert.equal(url({ id: 5, slug: 'abc' }).endsWith('/articulos/abc/44700'), true)
})

test('CA11: ya_estoy_en_la_ficha de la promo reconoce la ficha ~823', () => {
	const { ya_estoy_en_la_ficha } = cargar('@/components/promocion-personalizada/Index.vue').default.methods
	const en = slug => ({ $route: { name: 'Article', params: { slug, commerce_id: '44700' } } })
	assert.equal(ya_estoy_en_la_ficha.call(en('~823'), sin_slug), true)
	assert.equal(ya_estoy_en_la_ficha.call(en('otro'), sin_slug), false)
	assert.equal(ya_estoy_en_la_ficha.call(en('abc'), { id: 5, slug: 'abc' }), true)
})
