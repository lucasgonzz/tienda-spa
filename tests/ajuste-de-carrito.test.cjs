/*
 * Tests de aceptación de la misión carritos-ajuste-stock (tienda-spa): CA21 (textos y helper
 * puro), CA22 (acción del store que cambia "Completar mi carrito cuando vuelva a haber stock")
 * y la compatibilidad con una tienda-api anterior (campos ausentes, endpoint inexistente).
 *
 * Se ejecutan con: node --test tests/ajuste-de-carrito.test.cjs
 * El molde es tests/quitar-carrito.test.cjs: Babel + Axios real con el adapter mockeado.
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

// Raíz del proyecto tienda-spa.
const raiz = path.resolve(__dirname, '..')
// Cache de módulos ya transpilados.
const cache = new Map()

/**
 * Carga un módulo ES de src/ transpilándolo a CommonJS con Babel (sin tocar la config del proyecto).
 * @param {string} nombre ruta '@/...' o absoluta, o paquete de node_modules
 * @returns {object} exports del módulo
 */
function cargar(nombre) {
	if (nombre === '@/utils/tracking') return { trackear() {}, TIPOS_EVENTO: {} }
	if (!nombre.startsWith('@/') && !path.isAbsolute(nombre)) return require(nombre)
	let archivo = nombre.startsWith('@/') ? path.join(raiz, 'src', nombre.slice(2)) : nombre
	if (!path.extname(archivo)) archivo += '.js'
	if (cache.has(archivo)) return cache.get(archivo).exports
	const fuente = fs.readFileSync(archivo, 'utf8')
	const codigo = babel.transformSync(fuente, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code
	const modulo = { exports: {} }
	cache.set(archivo, modulo)
	new Function('require', 'module', 'exports', codigo)(cargar, modulo, modulo.exports)
	return modulo.exports
}

// Ruta del helper puro que debe crear la misión.
const ruta_helper = path.join(raiz, 'src', 'helpers', 'ajuste_de_carrito.js')

/**
 * Carga el helper nuevo. Si todavía no existe falla con una aserción clara (no con un ENOENT
 * críptico), para que el rojo diga el motivo: la funcionalidad no está construida.
 * @returns {object} funciones del helper
 */
function helper() {
	assert.ok(fs.existsSync(ruta_helper), 'Falta src/helpers/ajuste_de_carrito.js (helper puro del ajuste de carritos)')
	return cargar('@/helpers/ajuste_de_carrito')
}

/**
 * Arma una línea de carrito con cantidad actual y faltante opcional.
 * @param {number} amount unidades que quedaron en el carrito
 * @param {number|undefined} insuficiente unidades que faltan (amount_insuficiente)
 * @param {object} extra campos extra de la línea (pivot o raíz)
 * @returns {object} línea tal como la devuelve la API
 */
function linea(amount, insuficiente, extra = {}) {
	const pivot = { amount: amount, price: 10, notes: '', variant_id: null, ...(extra.pivot || {}) }
	if (insuficiente !== undefined) pivot.amount_insuficiente = insuficiente
	return { id: 1, name: 'Artículo 1', amount: amount, ...extra, pivot: pivot }
}

// ---------------------------------------------------------------- CA21: helper puro

test('CA21 texto_faltante dice cuántas agregó y cuántas hay disponibles', () => {
	const h = helper()
	assert.equal(h.texto_faltante({ pivot: { amount: 2, amount_insuficiente: 3 } }), 'Agregaste 5 unidades, ahora hay 2 disponibles.')
	assert.equal(h.texto_faltante({ pivot: { amount: 0, amount_insuficiente: 3 } }), 'Agregaste 3 unidades, ahora hay 0 disponibles.')
	// Singular cuando lo pedido es 1 unidad.
	assert.equal(h.texto_faltante({ pivot: { amount: 0, amount_insuficiente: 1 } }), 'Agregaste 1 unidad, ahora hay 0 disponibles.')
})

test('CA21 unidades_pedidas suma lo que quedó más lo que falta', () => {
	const h = helper()
	assert.equal(h.unidades_pedidas({ pivot: { amount: 2, amount_insuficiente: 3 } }), 5)
	assert.equal(h.unidades_pedidas({ pivot: { amount: 4 } }), 4)
})

test('CA21 tiene_faltante es false con null, 0 o ausente y true con faltante positivo', () => {
	const h = helper()
	assert.equal(h.tiene_faltante({ pivot: { amount: 2, amount_insuficiente: null } }), false)
	assert.equal(h.tiene_faltante({ pivot: { amount: 2, amount_insuficiente: 0 } }), false)
	assert.equal(h.tiene_faltante({ pivot: { amount: 2 } }), false)
	assert.equal(h.tiene_faltante({ pivot: { amount: 2, amount_insuficiente: 3 } }), true)
})

test('CA21 completar_al_reponer es true si falta el campo y respeta 0/1/false', () => {
	const h = helper()
	assert.equal(h.completar_al_reponer({ pivot: { amount: 1 } }), true)
	assert.equal(h.completar_al_reponer({ pivot: { amount: 1, completar_al_reponer: 1 } }), true)
	assert.equal(h.completar_al_reponer({ pivot: { amount: 1, completar_al_reponer: 0 } }), false)
	assert.equal(h.completar_al_reponer({ pivot: { amount: 1, completar_al_reponer: false } }), false)
})

test('CA21 lineas_para_resumen saca los renglones en 0 con faltante y deja el resto', () => {
	const h = helper()
	const esperando = linea(0, 3)
	const recortada = linea(2, 3)
	const en_cero_sin_faltante = linea(0)
	const normal = linea(5)
	const resultado = h.lineas_para_resumen([esperando, recortada, en_cero_sin_faltante, normal])
	assert.deepEqual(resultado, [recortada, en_cero_sin_faltante, normal])
})

// ---------------------------------------------------------------- compatibilidad con API vieja (helper)

test('API vieja: sin campos nuevos no hay cartel, la casilla queda marcada y no hay aviso de agotarse', () => {
	const h = helper()
	const vieja = { id: 9, name: 'Viejo', amount: 3, pivot: { amount: 3, price: 10 } }
	assert.equal(h.tiene_faltante(vieja), false)
	assert.equal(h.completar_al_reponer(vieja), true)
	assert.equal(h.puede_agotarse(vieja), false)
	assert.deepEqual(h.lineas_para_resumen([vieja]), [vieja])
	// Sin pivot tampoco rompe.
	assert.equal(h.tiene_faltante({ id: 1 }), false)
	assert.equal(h.puede_agotarse({ id: 1 }), false)
})

test('puede_agotarse sólo es true cuando la API lo manda en true', () => {
	const h = helper()
	assert.equal(h.puede_agotarse({ id: 1, puede_agotarse: true }), true)
	assert.equal(h.puede_agotarse({ id: 1, puede_agotarse: false }), false)
	assert.equal(h.puede_agotarse({ id: 1, puede_agotarse: 0 }), false)
})

test('lineas_para_resumen tolera una lista vacía o ausente', () => {
	const h = helper()
	assert.deepEqual(h.lineas_para_resumen([]), [])
	assert.deepEqual(h.lineas_para_resumen(undefined), [])
})

// ---------------------------------------------------------------- CA22: acción del store

const modulo_cart = cargar('@/store/cart').default

/**
 * Crea un store Vuex con sólo el módulo cart y el carrito indicado cargado.
 * @param {object} datos carrito inicial
 * @returns {Vuex.Store}
 */
function tienda(datos) {
	const store = new Vuex.Store({ modules: { cart: { ...modulo_cart, state: JSON.parse(JSON.stringify(modulo_cart.state)) } } })
	store.commit('cart/setCart', datos)
	return store
}

/**
 * Arma un carrito mínimo con las líneas dadas.
 * @param {Array} articulos líneas
 * @returns {object}
 */
function carrito(articulos) {
	return { id: 38, articles: articulos, promociones_vinoteca: [], combos: [] }
}

/**
 * Crea un error de Axios con status HTTP.
 * @param {number} status
 * @param {object} data cuerpo de la respuesta de error
 * @returns {Error}
 */
function error_http(status, data = { cart: null }) {
	return Object.assign(new Error('Fallo controlado ' + status), { response: { status: status, data: data } })
}

/**
 * Reemplaza el adapter de Axios (sólo la red) y lo restaura al terminar el test.
 * @param {object} t contexto del test
 * @param {Function} responder recibe (config, cuerpo) y devuelve respuesta o promesa
 * @returns {Array} llamadas registradas
 */
function mockear_red(t, responder) {
	const anterior = axios.defaults.adapter
	t.after(() => { axios.defaults.adapter = anterior })
	const llamadas = []
	axios.defaults.adapter = config => {
		const cuerpo = config.data === undefined ? undefined : JSON.parse(config.data)
		llamadas.push({ method: config.method, url: config.url, cuerpo: cuerpo })
		return Promise.resolve(responder(config, cuerpo)).then(res => ({ status: 200, statusText: 'OK', headers: {}, config: config, ...res }))
	}
	return llamadas
}

test('CA22 cambiarCompletarAlReponer hace PATCH con tipo, id, variante y valor, y aplica la respuesta', async t => {
	const item = linea(2, 3, { pivot: { variant_id: 22 } })
	const store = tienda(carrito([item]))
	assert.equal(typeof store._actions['cart/cambiarCompletarAlReponer'], 'object', 'Falta la acción cart/cambiarCompletarAlReponer')
	const actualizado = linea(2, 3, { pivot: { variant_id: 22, completar_al_reponer: 0 } })
	const llamadas = mockear_red(t, () => ({ data: { cart: carrito([actualizado]) } }))
	await store.dispatch('cart/cambiarCompletarAlReponer', { item: item, valor: false })
	assert.equal(llamadas.length, 1)
	assert.equal(llamadas[0].method, 'patch')
	assert.equal(llamadas[0].url, '/api/carts/38/items')
	assert.deepEqual(llamadas[0].cuerpo, { tipo: 'articulo', id: 1, variant_id: 22, completar_al_reponer: false })
	assert.equal(store.state.cart.cart.articles[0].pivot.completar_al_reponer, 0)
	assert.equal(store.state.cart.saving, false)
})

test('CA22 sin variante manda variant_id null', async t => {
	const item = linea(2, 3)
	const store = tienda(carrito([item]))
	assert.equal(typeof store._actions['cart/cambiarCompletarAlReponer'], 'object', 'Falta la acción cart/cambiarCompletarAlReponer')
	const llamadas = mockear_red(t, () => ({ data: { cart: carrito([item]) } }))
	await store.dispatch('cart/cambiarCompletarAlReponer', { item: item, valor: true })
	assert.deepEqual(llamadas[0].cuerpo, { tipo: 'articulo', id: 1, variant_id: null, completar_al_reponer: true })
})

test('CA22 con 404 o 405 (API vieja) rechaza con api_vieja y el estado no cambia', async t => {
	for (const status of [404, 405]) {
		const item = linea(2, 3)
		const store = tienda(carrito([item]))
		assert.equal(typeof store._actions['cart/cambiarCompletarAlReponer'], 'object', 'Falta la acción cart/cambiarCompletarAlReponer')
		const antes = JSON.stringify(store.state.cart.cart)
		mockear_red(t, () => Promise.reject(error_http(status)))
		await assert.rejects(store.dispatch('cart/cambiarCompletarAlReponer', { item: item, valor: false }), e => e.api_vieja === true)
		assert.equal(JSON.stringify(store.state.cart.cart), antes)
		assert.equal(store.state.cart.saving, false)
	}
})

test('CA22 otros errores (422 no_disponible, 500, sin red) rechazan sin api_vieja y sin tocar el carrito', async t => {
	const fallos = [error_http(422, { cart: null, codigo: 'no_disponible' }), error_http(500), new Error('Sin red')]
	for (const fallo of fallos) {
		const item = linea(2, 3)
		const store = tienda(carrito([item]))
		assert.equal(typeof store._actions['cart/cambiarCompletarAlReponer'], 'object', 'Falta la acción cart/cambiarCompletarAlReponer')
		const antes = JSON.stringify(store.state.cart.cart)
		mockear_red(t, () => Promise.reject(fallo))
		await assert.rejects(store.dispatch('cart/cambiarCompletarAlReponer', { item: item, valor: false }), e => e === fallo && e.api_vieja !== true)
		assert.equal(JSON.stringify(store.state.cart.cart), antes)
		assert.equal(store.state.cart.saving, false)
	}
})

test('API vieja: una respuesta del carrito sin campos nuevos se aplica sin romper', () => {
	const vieja = { id: 9, name: 'Viejo', amount: 3, pivot: { amount: 3, price: 10, variant_id: null } }
	const store = tienda(carrito([vieja]))
	assert.equal(store.state.cart.cart.articles.length, 1)
	assert.equal(store.state.cart.cart.articles[0].pivot.completar_al_reponer, undefined)
	assert.equal(store.state.cart.cart.articles[0].puede_agotarse, undefined)
})

// ---------------------------------------------------------------- cableado de componentes (texto fuente)

/**
 * Lee un archivo de src/ como texto; falla con aserción clara si no existe.
 * @param {string} relativo ruta relativa a la raíz
 * @returns {string}
 */
function leer_fuente(relativo) {
	const archivo = path.join(raiz, relativo)
	assert.ok(fs.existsSync(archivo), 'Falta ' + relativo)
	return fs.readFileSync(archivo, 'utf8')
}

test('CartStockNotice existe, usa el helper y la acción, y sólo se muestra en la ruta Cart', () => {
	const fuente = leer_fuente('src/components/common/article-card/body/CartStockNotice.vue')
	assert.match(fuente, /texto_faltante/)
	assert.match(fuente, /cart\/cambiarCompletarAlReponer/)
	assert.match(fuente, /b-form-checkbox/)
	assert.match(fuente, /Completar mi carrito cuando vuelva a haber stock/)
	assert.match(fuente, /Este producto está en el carrito de otros clientes; si mandan su pedido antes, puede agotarse\./)
	assert.match(fuente, /Actualizá la página e intentá de nuevo/)
	assert.match(fuente, /['"]Cart['"]/)
})

test('el renglón del carrito registra CartStockNotice', () => {
	const fuente = leer_fuente('src/components/common/article-card/body/Index.vue')
	assert.match(fuente, /CartStockNotice/)
})

test('el resumen del checkout usa lineas_para_resumen para no mostrar renglones en 0', () => {
	const fuente = leer_fuente('src/components/payment/components/CartResume.vue')
	assert.match(fuente, /lineas_para_resumen/)
})
