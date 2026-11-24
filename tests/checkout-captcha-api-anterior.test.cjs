// Compatibilidad del CAPTCHA del checkout con una tienda-api ANTERIOR (sin GET buyer/checkout-captcha).
// Una API vieja responde 404 de ruta inexistente: la compra debe seguir como antes. Cualquier otro
// fallo (403, 429, 5xx, red, 404 con payload de captcha, cuerpo inválido) NO es una API vieja y
// debe seguir bloqueando el checkout: el servidor nuevo es quien exige el token.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const babel = require('@babel/core')
const Vue = require('vue')
const Vuex = require('vuex')
Vue.use(Vuex)
const cache = new Map()
function local(archivo) {
	if (!path.extname(archivo)) archivo += '.js'
	if (cache.has(archivo)) return cache.get(archivo).exports
	let fuente = fs.readFileSync(archivo, 'utf8')
	if (archivo.endsWith('.vue')) fuente = require('vue-template-compiler').parseComponent(fuente).script.content
	const codigo = babel.transformSync(fuente, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code
	const modulo = { exports: {} }
	cache.set(archivo, modulo)
	const resolver = nombre => nombre === '@/utils/tracking' ? { trackear() {}, enviar_cola() {}, TIPOS_EVENTO: {} } : nombre.startsWith('@/') ? local(path.resolve(__dirname, '../src', nombre.slice(2))) : nombre.startsWith('.') ? local(path.resolve(path.dirname(archivo), nombre)) : require(nombre)
	new Function('require', 'module', 'exports', codigo)(resolver, modulo, modulo.exports)
	return modulo.exports
}
const load = nombre => local(path.resolve(__dirname, '../src', nombre))
const Cart = load('store/cart')
const Captcha = load('components/payment/components/CheckoutCaptcha.vue').default
const Btn = load('components/payment/components/BtnSave.vue').default
const methods = load('mixins/cart').default.methods
const tick = () => new Promise(r => setImmediate(r))
const enabled = { provider: 'turnstile', state: 'enabled', required: true, site_key: 'publica-fake', action: 'checkout' }
// Respuesta real de Laravel ante una ruta inexistente (API anterior) y variantes de servidor.
const ruta_inexistente = { response: { status: 404, data: { message: 'The route api/buyer/checkout-captcha could not be found.' } } }
function store() {
	return new Vuex.Store({ modules: {
		cart: { ...Cart.default, state: JSON.parse(JSON.stringify(Cart.default.state)), actions: { save() { return [] } } },
		commerce: { state: { commerce: { id: 1, owner_id: 10 } }, mutations: { owner(s, id) { s.commerce.owner_id = id } } },
		orders: { namespaced: true, state: { order: null }, actions: { getCurrentOrder() {} } },
		auth: { namespaced: true, state: { user: null, authenticated: false }, mutations: { setLoading() {}, setMessage() {}, setUser(s, u) { s.user = u }, user(s, u) { s.user = u } } },
	} })
}
function widget(t, get) {
	const s = store(), callbacks = [], scripts = []
	global.window = { turnstile: { render(el, opts) { callbacks.push(opts); return callbacks.length }, remove() {} } }
	global.document = { createElement() { return {} }, head: { appendChild(script) { scripts.push(script); script.parentNode = { removeChild() {} } } } }
	const vm = new Vue({ ...Captcha, store: s, beforeCreate() { this.$api = { get } } })
	vm.$refs.widget = {}
	let ready = false
	vm.$on('ready', value => { ready = value })
	vm.iniciar()
	t.after(() => { vm.$destroy(); delete global.window; delete global.document })
	return { s, vm, callbacks, scripts, ready: () => ready }
}
function order(s, post) {
	s.commit('cart/setCart', { id: 1, articles: [{ id: 1, pivot: { amount: 1 } }], promociones_vinoteca: [] })
	const vm = { ...methods, $store: s, user: { id: 3 }, total: 50, canMakeOrder() { return true }, verificar_modo_del_pedido() {},
		$api: { post }, manejar_articulos_no_disponibles() { return false }, manejar_error_consulta_stock() { return false },
		manejar_error_de_direccion() { return false }, manejar_error_de_envio() { return false }, es_corte_por_articulos_no_disponibles() { return false } }
	Object.defineProperty(vm, 'cart', { get: () => s.state.cart.cart })
	return vm
}

test('API anterior: 404 de ruta inexistente deja comprar como antes, sin widget ni proveedor ni error', async t => {
	let calls = 0
	const w = widget(t, () => { calls++; return Promise.reject(ruta_inexistente) })
	await tick()
	assert.equal(w.ready(), true)
	assert.equal(w.vm.error, false)
	assert.equal(w.vm.mensaje, '')
	assert.equal(w.callbacks.length, 0)
	assert.equal(w.scripts.length, 0)
	assert.equal(Cart.consumir_token_captcha(w.s.state), null)
	assert.equal(calls, 1)
})

test('API anterior: 404 sin cuerpo JSON (HTML del servidor viejo) también equivale a endpoint inexistente', async t => {
	for (const data of ['<html>404 Not Found</html>', '', undefined, null]) {
		const w = widget(t, () => Promise.reject({ response: { status: 404, data } }))
		await tick()
		assert.equal(w.ready(), true, JSON.stringify(data))
		assert.equal(w.vm.error, false)
	}
})

test('API anterior: el pedido sale por POST orders sin captcha_token y sin tocar el borrador', async t => {
	const w = widget(t, () => Promise.reject(ruta_inexistente))
	await tick()
	assert.equal(w.ready(), true)
	w.s.commit('cart/set_buyer_field', { field: 'address', value: 'Borrador' })
	const requests = []
	const vm = order(w.s, (url, body) => { requests.push({ url, body }); return Promise.resolve({ data: { order_id: 90 } }) })
	await vm.makeOrder()
	assert.equal(requests.length, 1)
	assert.equal(requests[0].url, '/orders')
	assert.equal(requests[0].body.captcha_token, undefined)
	// Con ready(true) el botón deja de bloquear el fieldset (captcha_listo viene del evento ready).
	let dispatched = 0
	const btn = { procesando: false, captcha_listo: w.ready(), ready() { dispatched++ } }
	Btn.methods.confirmar.call(btn)
	assert.equal(dispatched, 1)
})

test('errores reales NO son API anterior: 401/403/419/429/500/502/503 bloquean y permiten retry explícito', async t => {
	for (const status of [401, 403, 419, 429, 500, 502, 503]) {
		const w = widget(t, () => Promise.reject({ response: { status, data: { message: 'fake' } } }))
		await tick()
		assert.equal(w.ready(), false, 'status ' + status)
		assert.equal(w.vm.error, true, 'status ' + status)
		assert.equal(w.callbacks.length, 0)
	}
})

test('fallo de red, timeout o rechazo sin response NO es API anterior', async t => {
	const casos = [new Error('Network Error'), { code: 'ECONNABORTED', message: 'timeout of 10000ms exceeded' }, { request: {} }, undefined, null]
	for (const caso of casos) {
		const w = widget(t, () => Promise.reject(caso))
		await tick()
		assert.equal(w.ready(), false, String(caso))
		assert.equal(w.vm.error, true, String(caso))
	}
})

test('404 que trae payload de captcha de la API nueva no se interpreta como API anterior', async t => {
	const w = widget(t, () => Promise.reject({ response: { status: 404, data: { captcha: { provider: 'turnstile', state: 'disabled', required: false } } } }))
	await tick()
	assert.equal(w.ready(), false)
	assert.equal(w.vm.error, true)
})

test('200 con cuerpo inválido o configuración incompleta de la API nueva sigue bloqueando', async t => {
	for (const data of [{}, { captcha: null }, { captcha: { ...enabled, site_key: '' } }, { captcha: { ...enabled, state: 'misconfigured' } }]) {
		const w = widget(t, () => Promise.resolve({ data }))
		await tick()
		assert.equal(w.ready(), false, JSON.stringify(data))
		assert.equal(w.vm.error, true, JSON.stringify(data))
	}
})

test('404 tardío de un ciclo viejo (owner cambiado) no habilita el checkout nuevo', async t => {
	const pendientes = []
	const w = widget(t, () => new Promise((resolve, reject) => pendientes.push({ resolve, reject })))
	w.s.commit('owner', 99)
	pendientes[0].reject(ruta_inexistente)
	await tick()
	assert.equal(w.ready(), false)
	assert.equal(w.vm.error, false)
	pendientes[1].resolve({ data: { captcha: enabled } }); await tick()
	assert.equal(w.callbacks.length, 1)
	assert.equal(w.ready(), false)
})

test('la compatibilidad no se cachea: si la API pasa a la versión nueva, la renovación vuelve a consultar y protege', async t => {
	let nueva = false
	const w = widget(t, () => nueva ? Promise.resolve({ data: { captcha: enabled } }) : Promise.reject(ruta_inexistente))
	await tick()
	assert.equal(w.ready(), true)
	nueva = true
	w.s.commit('cart/renovar_captcha')
	await tick()
	assert.equal(w.callbacks.length, 1)
	assert.equal(w.ready(), false)
})
