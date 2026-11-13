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
const raiz = path.resolve(__dirname, '..')
const cache = new Map()
function cargar(nombre) {
	if (nombre === '@/utils/tracking') return { trackear() {}, TIPOS_EVENTO: {} }
	if (!nombre.startsWith('@/') && !path.isAbsolute(nombre)) return require(nombre)
	let archivo = nombre.startsWith('@/') ? path.join(raiz, 'src', nombre.slice(2)) : nombre
	if (!path.extname(archivo)) archivo += '.js'
	if (cache.has(archivo)) return cache.get(archivo).exports
	let fuente = fs.readFileSync(archivo, 'utf8')
	const relativo = path.relative(raiz, archivo).split(path.sep).join('/')
	if (process.env.CC_TEST_BASE_REF && ['src/store/cart.js', 'src/mixins/articles.js'].includes(relativo)) {
		fuente = execFileSync('git', ['show', process.env.CC_TEST_BASE_REF + ':' + relativo], { cwd: raiz, encoding: 'utf8' })
	}
	const codigo = babel.transformSync(fuente, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code
	const modulo = { exports: {} }
	cache.set(archivo, modulo)
	new Function('require', 'module', 'exports', codigo)(cargar, modulo, modulo.exports)
	return modulo.exports
}
const modulo = cargar('@/store/cart').default
const mixin = cargar('@/mixins/articles').default

function linea(id, cantidad = 1, variante = null) {
	return { id, name: 'Artículo ' + id, amount: cantidad, pivot: { amount: cantidad, price: 10, notes: '', variant_id: variante } }
}
function carrito(articulos, otros = {}) {
	return { id: 38, articles: articulos, promociones_vinoteca: [], combos: [], ...otros }
}
function tienda(datos) {
	const store = new Vuex.Store({ modules: { cart: { ...modulo, state: JSON.parse(JSON.stringify(modulo.state)) } } })
	store.commit('cart/setCart', datos)
	return store
}
function respuesta(cart) { return { data: { cart } } }
function error(status) { return Object.assign(new Error('Fallo controlado'), { response: { status } }) }
const transportes = new WeakMap()
function controlar(t, metodos) {
	let control = transportes.get(t)
	if (!control) {
		control = { metodos: {} }
		transportes.set(t, control)
		const anterior = axios.defaults.adapter
		t.after(() => { axios.defaults.adapter = anterior })
		// Se aísla sólo la red: request(), los alias, mergeConfig y transformRequest son los
		// de Axios instalado. Un stub de delete() ocultó que esa versión descartaba el body.
		axios.defaults.adapter = config => {
			const funcion = control.metodos[config.method]
			assert.equal(typeof funcion, 'function', 'Transporte no previsto: ' + config.method)
			const cuerpo = config.data === undefined ? undefined : JSON.parse(config.data)
			const argumentos = config.method === 'delete' ? { data: cuerpo } : cuerpo
			return Promise.resolve(funcion(config.url, argumentos)).then(res => ({ status: 200, statusText: 'OK', headers: {}, config, ...res }))
		}
	}
	Object.assign(control.metodos, metodos)
}

test('Axios real serializa el cuerpo DELETE con tipo, id y variante', async t => {
	const anterior = axios.defaults.adapter
	t.after(() => { axios.defaults.adapter = anterior })
	let recibida
	axios.defaults.adapter = config => {
		recibida = config
		return Promise.resolve({ data: { cart: carrito([linea(2, 0)]) }, status: 200, statusText: 'OK', headers: {}, config })
	}
	const item = linea(1, 4, 22)
	const store = tienda(carrito([item, linea(2, 0)]))
	await store.dispatch('cart/quitarItem', item)
	assert.equal(recibida.method, 'delete')
	assert.equal(recibida.url, '/api/carts/38/items')
	assert.equal(typeof recibida.data, 'string')
	assert.equal(recibida.headers['Content-Type'], 'application/json;charset=utf-8')
	assert.deepEqual(JSON.parse(recibida.data), { tipo: 'articulo', id: 1, variant_id: 22 })
	assert.deepEqual(store.state.cart.cart.articles.map(a => a.id), [2])
})

test('Quitar usa el endpoint específico y conserva el carrito visible hasta confirmar', async t => {
	const elegida = linea(1, 4, 22)
	const cero = linea(2, 0)
	const store = tienda(carrito([elegida, cero]))
	let confirmar
	const llamadas = []
	controlar(t, { delete(url, opciones) { llamadas.push({ url, opciones }); return new Promise(resolve => { confirmar = resolve }) } })
	const trabajo = store.dispatch('cart/quitarItem', elegida)
	await new Promise(resolve => setImmediate(resolve))
	assert.deepEqual(JSON.parse(JSON.stringify(store.state.cart.cart.articles)).map(a => a.id), [1, 2])
	assert.deepEqual(llamadas, [{ url: '/api/carts/38/items', opciones: { data: { tipo: 'articulo', id: 1, variant_id: 22 } } }])
	confirmar(respuesta(carrito([cero])))
	await trabajo
	assert.deepEqual(store.state.cart.cart.articles.map(a => a.id), [2])
	assert.equal(store.state.cart.cart.articles[0].pivot.amount, 0)
	assert.equal(store.state.cart.saving, false)
})

test('un fallo de red, permisos o validación no borra la línea ni ejecuta PUT', async t => {
	let puts = 0
	controlar(t, { put() { puts++; return Promise.resolve(respuesta(null)) } })
	for (const fallo of [error(403), error(422), error(500), new Error('Sin red')]) {
		const item = linea(1)
		const store = tienda(carrito([item, linea(2, 0)]))
		const antes = JSON.stringify(store.state.cart.cart)
		controlar(t, { delete() { return Promise.reject(fallo) } })
		await assert.rejects(store.dispatch('cart/quitarItem', item), e => e === fallo)
		assert.equal(JSON.stringify(store.state.cart.cart), antes)
		assert.equal(store.state.cart.saving, false)
	}
	assert.equal(puts, 0)
})

test('una API anterior usa PUT sobre una copia y conserva otras variantes y el envío', async t => {
	for (const status of [404, 405]) {
		const item = linea(1, 2, 22)
		const otra = linea(1, 3, 23)
		const store = tienda(carrito([item, otra, linea(2, 0)], { deliver: 1 }))
		store.state.cart.envio.opcion_key = 'opcion-vigente'
		let recibido
		let confirmar
		controlar(t, {
			delete() { return Promise.reject(error(status)) },
			put(url, payload) { recibido = { url, payload }; return new Promise(resolve => { confirmar = resolve }) },
		})
		const antes = JSON.stringify(store.state.cart.cart)
		const trabajo = store.dispatch('cart/quitarItem', item)
		await new Promise(resolve => setImmediate(resolve))
		assert.equal(JSON.stringify(store.state.cart.cart), antes)
		assert.equal(recibido.url, '/api/carts')
		assert.deepEqual(recibido.payload.articles.map(a => [a.id, a.pivot.variant_id]), [[1, 23], [2, null]])
		assert.equal(recibido.payload.envio.opcion_key, 'opcion-vigente')
		confirmar(respuesta(carrito([otra, linea(2, 0)])))
		await trabajo
	}
})

test('si el fallback es rechazado, el carrito original sigue intacto', async t => {
	const item = linea(1)
	const store = tienda(carrito([item, linea(2, 0)]))
	const antes = JSON.stringify(store.state.cart.cart)
	controlar(t, { delete() { return Promise.reject(error(404)) }, put() { return Promise.reject(error(422)) } })
	await assert.rejects(store.dispatch('cart/quitarItem', item))
	assert.equal(JSON.stringify(store.state.cart.cart), antes)
})

test('el invitado sin carrito guardado quita localmente y no crea un carrito en la API', async t => {
	const item = linea(1)
	const store = tienda(carrito([item, linea(2)], { id: null }))
	controlar(t, { delete() { assert.fail('No debe llamar DELETE') }, post() { assert.fail('No debe llamar POST') }, put() { assert.fail('No debe llamar PUT') } })
	await store.dispatch('cart/quitarItem', item)
	assert.deepEqual(store.state.cart.cart.articles.map(a => a.id), [2])
})

test('el tipo distingue artículos, promociones y combos con el mismo id', async t => {
	for (const tipo of ['promocion_vinoteca', 'combo']) {
		const item = { ...linea(1), [tipo === 'combo' ? 'is_combo' : 'is_promocion_vinoteca']: true }
		const coleccion = tipo === 'combo' ? 'combos' : 'promociones_vinoteca'
		const store = tienda(carrito([linea(1)], { [coleccion]: [item] }))
		let llamadas = 0
		controlar(t, { delete(url, opciones) {
			llamadas++
			assert.equal(opciones.data.tipo, tipo)
			return Promise.resolve(respuesta(carrito([linea(1)])))
		} })
		await store.dispatch('cart/quitarItem', item)
		assert.equal(llamadas, 1)
		assert.equal(store.state.cart.cart.articles.length, 1)
	}
})

test('el botón Quitar no ejecuta una mutación optimista y siempre apaga su indicador', async () => {
	const item = linea(1)
	const llamadas = []
	let resolver
	const vista = {
		get_item_cart() { return item },
		$store: {
			commit(...args) { llamadas.push(args) },
			dispatch(nombre, valor) { assert.equal(nombre, 'cart/quitarItem'); assert.equal(valor, item); return new Promise(resolve => { resolver = resolve }) },
		},
		$toast: { error() { assert.fail('No debe mostrar error') } },
	}
	const antes = global.confirm
	global.confirm = () => true
	try {
		mixin.methods.remove_cart.call(vista, item)
		assert.equal(llamadas.some(([nombre]) => nombre === 'cart/removeArticle'), false)
		resolver()
		await new Promise(resolve => setImmediate(resolve))
		assert.deepEqual(llamadas.at(-1), ['auth/setLoading', false])
	} finally { global.confirm = antes }
})
