/*
 * Misión truvari-carrito-entrega-pago, parte B (B1-B4): el checkout no puede quedar colgado.
 *
 * El bug (diagnóstico 26/11/2026): un comprador SIN sesión que compra como invitado con el email de una
 * cuenta que tiene contraseña recibe de POST /api/buyer el modelo recortado de
 * BuyerController::modeloParaElCheckout() ({id, address, ciudad, barrio, seller_id, addresses}), SIN email.
 * observar_checkout (checkout_session.js) sólo acepta al invitado identificado si el email coincide, así que
 * reinicia el checkout (nombre, email, teléfono, dirección vacíos, carrito sin id) y BtnSave.ready() sale por
 * `if (!vigente()) return` SIN bajar `procesando`: el botón queda "Enviando..." para siempre.
 *
 * Patrón: store real con observar_checkout + métodos reales de BtnSave.vue / mixins/cart.js sobre un vm falso
 * con `$api.post` espía (mismo esquema que `checkout-session.test.cjs` y `checkout-captcha.test.cjs`).
 * Nada de red ni de navegador.
 */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const babel = require('@babel/core')
const Vue = require('vue')
const Vuex = require('vuex')
Vue.use(Vuex)

// Cache de módulos ya transformados (el mismo archivo se carga una sola vez).
const cache = new Map()
/**
 * Carga un módulo (o .vue) de src/ transformado con babel a commonjs.
 * @param {string} archivo ruta absoluta
 * @returns {object} exports
 */
function local(archivo) {
	if (!path.extname(archivo)) archivo += '.js'
	if (cache.has(archivo)) return cache.get(archivo).exports
	let fuente = fs.readFileSync(archivo, 'utf8')
	if (archivo.endsWith('.vue')) fuente = require('vue-template-compiler').parseComponent(fuente).script.content
	const codigo = babel.transformSync(fuente, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code
	const modulo = { exports: {} }
	cache.set(archivo, modulo)
	const resolver = nombre => nombre === '@/utils/tracking' ? { trackear() {}, enviar_cola() {}, TIPOS_EVENTO: {} }
		: nombre === '@/mixins/payment_set_height' ? { default: {} }
		: nombre.startsWith('@/') ? local(path.resolve(__dirname, '../src', nombre.slice(2)))
		: nombre.startsWith('.') ? local(path.resolve(path.dirname(archivo), nombre))
		: require(nombre)
	new Function('require', 'module', 'exports', codigo)(resolver, modulo, modulo.exports)
	return modulo.exports
}
const load = nombre => local(path.resolve(__dirname, '../src', nombre))

const Cart = load('store/cart')
const Session = load('store/checkout_session')
const Addresses = load('store/buyer_addresses').default
const cart_methods = load('mixins/cart').default.methods
const Btn = load('components/payment/components/BtnSave.vue').default

// Decisión del Coordinador: cuando la sesión cambia mientras se confirma NO hay toast (invariante QA3: la respuesta
// de un checkout viejo no tiene efecto sobre el contexto nuevo); sólo baja `procesando`.
// Lo que devuelve tienda-api para un comprador con credencial: recortado y SIN email.
const MODELO_RECORTADO = { id: 5, address: 'Av. Siempre Viva 742', ciudad: 'Córdoba', barrio: 'Centro', seller_id: null, addresses: [] }
const turno = () => new Promise(r => setImmediate(r))

/**
 * Arma el escenario: invitado (sin sesión) con el checkout cargado, store real con observar_checkout y un
 * vm con los métodos reales de BtnSave.vue y del mixin del carrito.
 * `post_buyer` se resuelve/rechaza a mano con f.ok(modelo) / f.fail().
 * @returns {object} f
 */
function escenario() {
	const requests = [], routes = [], errors = [], continuaciones = []
	const store = new Vuex.Store({ modules: {
		cart: { ...Cart.default, state: JSON.parse(JSON.stringify(Cart.default.state)), actions: { ...Cart.default.actions, save() { return [] } } },
		auth: { namespaced: true, state: { user: null, authenticated: false }, mutations: {
			setUser(s, u) { s.user = u }, setAuthenticated(s, v) { s.authenticated = v }, setLoading() {}, setMessage() {},
		} },
		commerce: { namespaced: true, state: { commerce: { id: 1, owner_id: 10 } }, mutations: { setCommerce(s, v) { s.commerce = v } } },
		buyer_addresses: { ...Addresses, state: JSON.parse(JSON.stringify(Addresses.state)) },
		orders: { namespaced: true, state: { order: null }, actions: { getCurrentOrder() { return Promise.reject(new Error('auxiliar')) } } },
		delivery_zones: { namespaced: true, state: { models: [] } },
	}, plugins: [Session.observar_checkout] })
	// Sin días de entrega configurados (lo que mira must_select_delivery_day).
	store.state.delivery_day = { models: [] }
	// Datos que el invitado tipeó: el email es el de una cuenta con contraseña.
	for (const [field, value] of Object.entries({ name: 'Fernando Invitado', email: 'cuenta@example.test', phone: '3515550000', ciudad: 'Córdoba', address: 'Av. Siempre Viva 742' })) {
		store.commit('cart/set_buyer_field', { field, value })
	}
	store.commit('cart/setCart', { id: 20, articles: [{ id: 1, pivot: { amount: 1, price: 50 } }], promociones_vinoteca: [], combos: [], deliver: 0 })
	const vm = {
		...cart_methods, ...Btn.methods, $store: store, procesando: false, captcha_listo: true,
		puede_comprar_sin_login: true, payment_methods: [{}], cart_payment_method: { id: 1 }, total: 50,
		direcciones_de_envio_activas: false, envio_zipnova_elegido: false, pedido_a_consultar: false,
		delivery_zones: [], cart_delivery_zone: null, cart_envio_opcion: null,
		is_mp: false, is_payway: false, es_tarjeta_mp: false, flag_activo() { return false },
		canMakeOrder() { return true }, verificar_modo_del_pedido() {},
		es_corte_por_articulos_no_disponibles() { return false }, manejar_articulos_no_disponibles() { return false },
		manejar_error_consulta_stock() { return false }, manejar_error_de_direccion() { return false }, manejar_error_de_envio() { return false },
		deleteCartAfterOrder() { return Promise.resolve() }, logoutGuestAfterOrder() { return Promise.resolve() },
		$toast: { error(m) { errors.push(m) } },
		$router: { push(r) { routes.push(r.name); return Promise.resolve() }, replace() { return Promise.resolve() } },
		$cookies: { set() {} },
		$api: {},
	}
	for (const key of ['user', 'authenticated']) Object.defineProperty(vm, key, { configurable: true, get: () => store.state.auth[key] })
	Object.defineProperty(vm, 'cart', { get: () => store.state.cart.cart })
	Object.defineProperty(vm, 'commerce', { get: () => ({ ...store.state.commerce.commerce, online_configuration: {} }) })
	// Espía de la continuación: guarda una foto del checkout en el momento en que se la invoca.
	const continuar_real = Btn.methods.continuar_checkout
	vm.continuar_checkout = function(...args) {
		continuaciones.push(foto(store))
		return continuar_real.apply(vm, args)
	}
	let resolver, rechazar
	vm.$api.post = (url, body) => {
		requests.push({ url, body })
		if (url === 'buyer') return new Promise((r, j) => { resolver = r; rechazar = j })
		return Promise.resolve({ data: { order_id: 30 } })
	}
	// Token de captcha ya resuelto: el pedido común lo consume al crear la orden.
	Cart.recibir_token_captcha(store.state, Cart.contexto_captcha(store.state), 'token-sintetico')
	return {
		store, vm, requests, routes, errors, continuaciones,
		ok(modelo = MODELO_RECORTADO) { resolver({ data: { model: modelo } }) },
		fail() { rechazar(new Error('HTTP sintético')) },
	}
}

/**
 * Foto de lo que el comprador cargó en el checkout (lo que un reinicio vacía).
 * @param {object} store
 * @returns {object}
 */
function foto(store) {
	const c = store.state.cart
	return {
		generacion: c.checkout_generation, name: c.buyer.name, email: c.buyer.email, phone: c.buyer.phone,
		address: c.buyer.address, deliver: c.cart.deliver, cart_id: c.cart.id,
	}
}

test('B1 invitado con el email de una cuenta con contraseña: el POST buyer vuelve sin email y el checkout NO se reinicia', async () => {
	const f = escenario()
	const antes = foto(f.store)
	const pendiente = f.vm.ready(false)
	f.ok()
	await pendiente
	// Una sola continuación, con el checkout intacto en el momento de continuar.
	assert.equal(f.continuaciones.length, 1, 'continuar_checkout se llama una vez')
	assert.deepEqual(f.continuaciones[0], antes, 'generación, nombre, email, teléfono, deliver, dirección y cart.id iguales')
	// Un pedido exitoso suma 1 a la generación (lo fija U2-01 de checkout-session); la foto de arriba prueba que no hubo reinicio.
	assert.equal(f.store.state.cart.checkout_generation, antes.generacion + 1)
	// Sale el pedido (POST orders) y se navega a Gracias: el primer clic alcanza.
	assert.deepEqual(f.requests.map(r => r.url), ['buyer', '/orders'])
	assert.equal(f.requests[1].body.buyer.id, 5)
	assert.deepEqual(f.routes, ['Thanks'])
	assert.equal(f.vm.procesando, false)
	assert.deepEqual(f.errors, [])
	assert.equal(f.store.state.auth.user.id, 5)
})

test('B1 con deliver=1 el envío a domicilio y la dirección tampoco se pierden', async () => {
	const f = escenario()
	f.store.commit('cart/setCart', { ...f.store.state.cart.cart, deliver: 1 })
	const antes = foto(f.store)
	assert.equal(antes.deliver, 1)
	const pendiente = f.vm.ready(false)
	f.ok()
	await pendiente
	assert.equal(f.continuaciones.length, 1)
	assert.deepEqual(f.continuaciones[0], antes)
	// Un pedido exitoso suma 1 a la generación (lo fija U2-01 de checkout-session); la foto de arriba prueba que no hubo reinicio.
	assert.equal(f.store.state.cart.checkout_generation, antes.generacion + 1)
	assert.equal(f.vm.procesando, false)
})

/**
 * Corta la sesión de la forma indicada mientras el POST buyer está en vuelo.
 * @param {object} f escenario
 * @param {string} tipo 'otro_id' | 'mismo_id_otro_objeto'
 */
function interponer(f, tipo) {
	if (tipo === 'otro_id') f.store.commit('auth/setUser', { id: 99, email: 'otro@example.test' })
	// Otro objeto con el mismo id que va a devolver el POST: no es el del POST, no se lo adopta.
	if (tipo === 'mismo_id_otro_objeto') f.store.commit('auth/setUser', { id: 5 })
}

for (const tipo of ['otro_id', 'mismo_id_otro_objeto']) {
	test(`B2 setUser ajeno (${tipo}) durante la identificación: reinicia como hoy y ready() termina con procesando=false y sin toast`, async () => {
		const f = escenario()
		const generacion = f.store.state.cart.checkout_generation
		const pendiente = f.vm.ready(false)
		interponer(f, tipo)
		assert.equal(f.store.state.cart.checkout_generation, generacion + 1, 'el reinicio de siempre ocurre')
		f.ok()
		await pendiente
		assert.equal(f.vm.procesando, false)
		assert.deepEqual(f.errors, [], 'sin toast: invariante QA3')
		assert.deepEqual(f.requests.map(r => r.url), ['buyer'], 'no se crea ningún pedido sobre la sesión ajena')
		assert.deepEqual(f.routes, [])
	})
}

test('B2 un setUser ajeno disparado SÍNCRONO por un subscriber justo después del del POST también reinicia', async () => {
	const f = escenario()
	let armado = true
	f.store.subscribe(m => {
		if (armado && m.type === 'auth/setUser' && m.payload && m.payload.id === 5) {
			armado = false
			f.store.commit('auth/setUser', { id: 99, email: 'otro@example.test' })
		}
	})
	const generacion = f.store.state.cart.checkout_generation
	const pendiente = f.vm.ready(false)
	f.ok()
	await pendiente
	assert.equal(f.store.state.cart.checkout_generation, generacion + 1)
	assert.equal(f.vm.procesando, false)
	assert.deepEqual(f.errors, [], 'sin toast: invariante QA3')
	assert.deepEqual(f.requests.map(r => r.url), ['buyer'])
})

test('B3 corte antes del POST (el componente ya no está vivo): procesando=false y sin toast', () => {
	const f = escenario()
	f.vm._isDestroyed = true
	f.vm.ready(false)
	assert.equal(f.vm.procesando, false)
	assert.deepEqual(f.errors, [])
	assert.deepEqual(f.requests, [])
})

test('B3 corte en el .then antes del setUser: procesando=false y sin toast (con el componente vivo o destruido)', async () => {
	for (const destruido of [false, true]) {
		const f = escenario()
		const pendiente = f.vm.ready(false)
		f.store.commit('cart/reset_checkout')
		if (destruido) f.vm._isDestroyed = true
		f.ok()
		await pendiente
		assert.equal(f.vm.procesando, false, 'destruido=' + destruido)
		assert.deepEqual(f.errors, [], 'sin toast (invariante QA3), destruido=' + destruido)
		assert.deepEqual(f.requests.map(r => r.url), ['buyer'])
	}
})

test('B3 corte en el .then después del setUser: procesando=false y sin toast (con el componente vivo o destruido)', async () => {
	for (const destruido of [false, true]) {
		const f = escenario()
		let armado = true
		f.store.subscribe(m => {
			if (armado && m.type === 'auth/setUser' && m.payload && m.payload.id === 5) {
				armado = false
				f.store.commit('cart/reset_checkout')
				if (destruido) f.vm._isDestroyed = true
			}
		})
		const pendiente = f.vm.ready(false)
		f.ok()
		await pendiente
		assert.equal(f.vm.procesando, false, 'destruido=' + destruido)
		assert.deepEqual(f.errors, [], 'sin toast (invariante QA3), destruido=' + destruido)
		assert.deepEqual(f.requests.map(r => r.url), ['buyer'])
	}
})

test('B3 corte en el .catch (la sesión cambió y el POST falla): procesando=false y sin toast (con el componente vivo o destruido)', async () => {
	for (const destruido of [false, true]) {
		const f = escenario()
		const pendiente = f.vm.ready(false)
		f.store.commit('cart/reset_checkout')
		if (destruido) f.vm._isDestroyed = true
		f.fail()
		await pendiente
		assert.equal(f.vm.procesando, false, 'destruido=' + destruido)
		assert.deepEqual(f.errors, [], 'sin toast (invariante QA3), destruido=' + destruido)
	}
})

test('B3 el error de red con la sesión vigente baja procesando y avisa lo de siempre (no cambia)', async () => {
	const f = escenario()
	const antes = foto(f.store)
	const pendiente = f.vm.ready(false)
	f.fail()
	await pendiente
	assert.equal(f.vm.procesando, false)
	assert.deepEqual(f.errors, ['Hubo un error al identificar el comprador'])
	assert.deepEqual(foto(f.store), antes, 'el borrador queda para reintentar')
})

test('B4 la identificación por email (API vieja que devuelve el modelo completo) sigue igual', async () => {
	const f = escenario()
	const antes = foto(f.store)
	const pendiente = f.vm.ready(false)
	f.ok({ id: 7, email: 'cuenta@example.test', name: 'Fernando' })
	await pendiente
	assert.equal(f.continuaciones.length, 1)
	assert.deepEqual(f.continuaciones[0], antes)
	assert.deepEqual(f.requests.map(r => r.url), ['buyer', '/orders'])
	assert.deepEqual(f.routes, ['Thanks'])
	assert.equal(f.vm.procesando, false)
	assert.equal(f.store.state.auth.user.id, 7)
})

test('B4 con deliver=1 y el modelo completo (por email) el checkout también sigue de largo', async () => {
	const f = escenario()
	f.store.commit('cart/setCart', { ...f.store.state.cart.cart, deliver: 1 })
	const antes = foto(f.store)
	const pendiente = f.vm.ready(false)
	f.ok({ id: 7, email: 'cuenta@example.test', name: 'Fernando' })
	await pendiente
	assert.equal(f.continuaciones.length, 1)
	assert.deepEqual(f.continuaciones[0], antes)
	assert.equal(f.vm.procesando, false)
})

test('B4 un setUser con otro email que el tipeado, fuera del POST, reinicia como siempre', () => {
	const f = escenario()
	const generacion = f.store.state.cart.checkout_generation
	f.store.commit('auth/setUser', { id: 8, email: 'ajeno@example.test' })
	assert.equal(f.store.state.cart.checkout_generation, generacion + 1)
	assert.equal(f.store.state.cart.buyer.name, '')
})

test('B4 identificar_invitado_checkout existe, adopta al comprador recortado y NO deja la marca abierta', () => {
	assert.equal(typeof Session.identificar_invitado_checkout, 'function', 'checkout_session.js exporta identificar_invitado_checkout')
	const f = escenario()
	const generacion = f.store.state.cart.checkout_generation
	const modelo = { ...MODELO_RECORTADO }
	Session.identificar_invitado_checkout(f.store, modelo)
	assert.equal(f.store.state.auth.user, modelo)
	assert.equal(f.store.state.cart.checkout_generation, generacion)
	// La marca se borra al terminar: un setUser posterior con el MISMO objeto ya no es "propio".
	f.store.commit('auth/setUser', null)
	assert.equal(f.store.state.cart.checkout_generation, generacion + 1)
	f.store.commit('auth/setUser', modelo)
	assert.equal(f.store.state.cart.checkout_generation, generacion + 2, 'sin marca vigente, el mismo objeto ya no se adopta: reinicia')
})
