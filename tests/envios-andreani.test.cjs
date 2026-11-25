// Misión envios-andreani, CA13 (tienda-spa): el cotizador de envío deja de depender sólo de Zipnova.
//
// Cubre dos piezas de lógica, sin DOM ni servidores (ver PLAN §2.6 y §10.2-10.3):
//  1. `setCommerce` (src/store/commerce.js) normaliza `envios_correo` y `envios_correo_config`:
//     con una tienda-api VIEJA (que sólo manda `envios_zipnova*`) caen a esos valores; con una
//     NUEVA mandan ellos (un comercio sólo-Andreani tiene `envios_correo` true y `envios_zipnova` false).
//  2. `cotizar_envio` (src/store/cart.js): con `opciones: []` y `sin_opciones_motivo === 'medidas'`
//     el texto es el de "muy grande para correo"; en cualquier otro caso, el de siempre.
//
// Ejecutar con: node --test tests/envios-andreani.test.cjs
// No usa la suite de Playwright. Axios real con el adaptador de red reemplazado (patrón de
// tests/quitar-carrito.test.cjs): sólo se aísla la red.
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

const raiz = path.resolve(__dirname, '..')
const cache = new Map()

/**
 * Carga un módulo ES de src/ (o un paquete de node) y lo ejecuta como commonjs.
 * `@/runtime_config` se reemplaza para no depender de `window.__CC_CONFIG__`.
 *
 * @param {string} nombre Import tal como aparece en el código ('@/store/cart').
 * @returns {object} Los exports del módulo.
 */
function cargar(nombre) {
	if (nombre === '@/runtime_config') return { env: () => '' }
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

const commerce_store = cargar('@/store/commerce').default
const cart_store = cargar('@/store/cart').default

// --- setCommerce: normalización de envios_correo -------------------------------------------------

/**
 * Aplica `setCommerce` sobre un estado limpio y devuelve el comercio guardado.
 *
 * @param {object|null} comercio Lo que devolvería GET /api/commerce/{id}.
 * @returns {object|null}
 */
function guardar_comercio(comercio) {
	const state = { commerce: null, workdays: [] }
	commerce_store.mutations.setCommerce(state, comercio)
	return state.commerce
}

test('API vieja con Zipnova: envios_correo y su config salen de envios_zipnova*', () => {
	const guardado = guardar_comercio({ id: 1, envios_zipnova: true, envios_zipnova_config: { envio_gratis_desde: 50000 } })
	assert.equal(guardado.envios_correo, true)
	assert.deepEqual(guardado.envios_correo_config, { envio_gratis_desde: 50000 })
})

test('API vieja sin Zipnova: envios_correo queda en false (el cotizador no se muestra)', () => {
	const guardado = guardar_comercio({ id: 1, envios_zipnova: false, envios_zipnova_config: { envio_gratis_desde: null } })
	assert.equal(guardado.envios_correo, false)
	assert.deepEqual(guardado.envios_correo_config, { envio_gratis_desde: null })
})

test('API vieja que ni manda envios_zipnova: envios_correo es false y no tira', () => {
	const guardado = guardar_comercio({ id: 1 })
	assert.equal(guardado.envios_correo, false)
})

test('API nueva sólo con Andreani: manda envios_correo y se respeta aunque envios_zipnova sea false', () => {
	const guardado = guardar_comercio({
		id: 1,
		envios_zipnova: false,
		envios_andreani: true,
		envios_correo: true,
		envios_correo_config: { envio_gratis_desde: 80000 },
	})
	assert.equal(guardado.envios_correo, true)
	assert.deepEqual(guardado.envios_correo_config, { envio_gratis_desde: 80000 })
	// Lo que mandó la API no se pisa ni se pierde.
	assert.equal(guardado.envios_zipnova, false)
	assert.equal(guardado.envios_andreani, true)
})

test('API nueva: envios_correo manda sobre envios_zipnova cuando difieren', () => {
	const guardado = guardar_comercio({
		id: 1,
		envios_zipnova: true,
		envios_zipnova_config: { envio_gratis_desde: 10 },
		envios_correo: false,
		envios_correo_config: { envio_gratis_desde: 20 },
	})
	assert.equal(guardado.envios_correo, false)
	assert.deepEqual(guardado.envios_correo_config, { envio_gratis_desde: 20 })
})

test('API nueva con config ausente: cae a envios_zipnova_config', () => {
	const guardado = guardar_comercio({
		id: 1,
		envios_zipnova: true,
		envios_zipnova_config: { envio_gratis_desde: 30 },
		envios_correo: true,
	})
	assert.deepEqual(guardado.envios_correo_config, { envio_gratis_desde: 30 })
})

test('setCommerce con null no rompe y deja null', () => {
	assert.equal(guardar_comercio(null), null)
})

// --- cotizar_envio: texto cuando no hay opciones -------------------------------------------------

const TEXTO_MEDIDAS = 'Tu compra es muy grande para enviarla por correo. Elegí retiro en el local o consultá al negocio.'
const TEXTO_SIN_CORREO = 'Ningún correo llega a ese código postal. Probá con otro o elegí retiro por el local.'

/**
 * Cotiza contra una respuesta simulada de POST /api/envios/cotizar y devuelve el estado del envío.
 *
 * @param {object} t Contexto del test (para restaurar el adaptador de axios).
 * @param {object} respuesta Cuerpo 200 que devuelve la "API".
 * @returns {Promise<object>} state.cart.envio luego de cotizar.
 */
function cotizar_con(t, respuesta) {
	const anterior = axios.defaults.adapter
	t.after(() => { axios.defaults.adapter = anterior })
	axios.defaults.adapter = config => Promise.resolve({ data: respuesta, status: 200, statusText: 'OK', headers: {}, config })
	const store = new Vuex.Store({ modules: { cart: { ...cart_store, state: JSON.parse(JSON.stringify(cart_store.state)) } } })
	store.state.cart.envio.zipcode = '5000'
	return store.dispatch('cart/cotizar_envio', { articles: [{ id: 1, amount: 1 }] })
		.then(() => store.state.cart.envio)
}

test('sin opciones por medidas: avisa que la compra es muy grande para el correo', t => {
	return cotizar_con(t, { opciones: [], zipcode: '5000', proveedores: { zipnova: 'ok', andreani: 'ok' }, sin_opciones_motivo: 'medidas' })
		.then(envio => {
			assert.equal(envio.error, TEXTO_MEDIDAS)
		})
})

test('sin opciones y sin motivo (API vieja o sin cobertura): el texto de siempre', t => {
	return cotizar_con(t, { opciones: [], zipcode: '5000' })
		.then(envio => {
			assert.equal(envio.error, TEXTO_SIN_CORREO)
		})
})

test('sin opciones con otro motivo: el texto de siempre', t => {
	return cotizar_con(t, { opciones: [], zipcode: '5000', sin_opciones_motivo: 'cobertura' })
		.then(envio => {
			assert.equal(envio.error, TEXTO_SIN_CORREO)
		})
})

test('con opciones el motivo no pone ningún error', t => {
	const opcion = { key: 'andreani|domicilio', proveedor: 'andreani', precio: 779.51, carrier_name: 'Andreani' }
	return cotizar_con(t, { opciones: [opcion], zipcode: '5000', sin_opciones_motivo: 'medidas' })
		.then(envio => {
			assert.equal(envio.error, null)
			assert.equal(envio.opciones.length, 1)
		})
})
