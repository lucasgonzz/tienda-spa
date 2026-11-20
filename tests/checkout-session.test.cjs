const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const babel = require('@babel/core')
const Vue = require('vue')
const Vuex = require('vuex')
const axios = require('axios')
Vue.use(Vuex)
const cache = new Map()
function cargar(nombre) {
	if (nombre === '@/utils/tracking') return { trackear() {}, enviar_cola() {}, TIPOS_EVENTO: {} }
	if (!nombre.startsWith('@/') && !nombre.startsWith('.')) return require(nombre)
	throw new Error('Usar resolver local')
}
function local(archivo) {
	if (!path.extname(archivo)) archivo += '.js'
	if (cache.has(archivo)) return cache.get(archivo).exports
	let fuente = fs.readFileSync(archivo, 'utf8')
	if (archivo.endsWith('.vue')) fuente = require('vue-template-compiler').parseComponent(fuente).script.content
	const codigo = babel.transformSync(fuente, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code
	const modulo = { exports: {} }
	cache.set(archivo, modulo)
	const resolver = nombre => nombre === '@/utils/tracking' ? cargar(nombre) : nombre === '@/mixins/payment_set_height' ? { default: {} } : nombre.startsWith('@/') ? local(path.resolve(__dirname, '../src', nombre.slice(2))) : nombre.startsWith('.') ? local(path.resolve(path.dirname(archivo), nombre)) : cargar(nombre)
	new Function('require', 'module', 'exports', codigo)(resolver, modulo, modulo.exports)
	return modulo.exports
}
const load = nombre => local(path.resolve(__dirname, '../src', nombre))
const Cart = load('store/cart').default
const Session = load('store/checkout_session')
const Addresses = load('store/buyer_addresses').default
const methods = load('mixins/cart').default.methods
const Buyer = load('components/payment/components/Buyer.vue').default
function caso() {
	const store = new Vuex.Store({ modules: {
		cart: { ...Cart, state: JSON.parse(JSON.stringify(Cart.state)), actions: { ...Cart.actions, save() { return [] } } },
		auth: { namespaced: true, state: { user: null, authenticated: false }, mutations: {
			setUser(s, u) { s.user = u }, setAuthenticated(s, v) { s.authenticated = v }, setLoading() {}, setMessage() {},
		} },
		commerce: { namespaced: true, state: { commerce: { id: 1, owner_id: 10 } }, mutations: { setCommerce(s, v) { s.commerce = v } } },
		buyer_addresses: { ...Addresses, state: JSON.parse(JSON.stringify(Addresses.state)) },
		orders: { namespaced: true, state: { order: null }, actions: { getCurrentOrder() { return Promise.reject(new Error('auxiliar')) } } },
	}, plugins: [Session.observar_checkout] })
	store.commit('cart/set_buyer_field', { field: 'email', value: 'prueba@example.test' })
	store.commit('cart/set_buyer_field', { field: 'address', value: 'Borrador' })
	store.commit('cart/setCart', { id: 20, articles: [{ id: 1, pivot: { amount: 1, price: 50 } }], promociones_vinoteca: [], payment_id: 'pago-1', payment_status: 'pending' })
	const vm = {
		...methods, $store: store, user: { id: 4 }, total: 50, canMakeOrder() { return true },
		verificar_modo_del_pedido() {}, $api: { post() { return Promise.resolve({ data: { order_id: 30 } }) } },
		$router: { push() {}, replace() { return Promise.resolve() } }, deleteCartAfterOrder() { return Promise.reject(new Error('delete auxiliar')) },
		logoutGuestAfterOrder() { return Promise.reject(new Error('logout auxiliar')) },
		es_corte_por_articulos_no_disponibles() { return false }, manejar_articulos_no_disponibles() { return false },
		manejar_error_consulta_stock() { return false }, manejar_error_de_direccion() { return false }, manejar_error_de_envio() { return false },
	}
	Object.defineProperty(vm, 'cart', { get: () => store.state.cart.cart })
	return { store, vm }
}
test('U2-01 segundo pedido vacío; éxito y fallos auxiliares no se convierten en compra fallida', async () => {
	const { store, vm } = caso()
	assert.equal(await vm.makeOrder(), true)
	assert.deepEqual({ ...store.state.cart.buyer }, Session.comprador_vacio())
	assert.equal(store.state.cart.cart.articles.length, 0)
	assert.equal(store.state.cart.checkout_completado.order_id, 30)
	assert.equal(store.state.cart.checkout_generation, 1)
	assert.equal(await vm.makeOrder(), false)
})
test('U2-02 éxito antes del pago vacía borrador y conserva identificador y total', async () => {
	const { store, vm } = caso()
	assert.equal(await vm.makeOrder(true), true)
	assert.equal(store.state.cart.buyer.email, '')
	assert.equal(store.state.cart.checkout_completado.payment_id, 'pago-1')
	assert.equal(store.state.cart.checkout_completado.total, 50)
})
test('U2-03 error del endpoint conserva borrador para reintentar', async () => {
	const { store, vm } = caso()
	vm.$api.post = () => Promise.reject(new Error('endpoint falso'))
	assert.equal(await vm.makeOrder(), null)
	assert.equal(store.state.cart.buyer.address, 'Borrador')
	assert.equal(store.state.cart.cart.id, 20)
	assert.equal(store.state.cart.checkout_generation, 0)
})
test('U2-04 buyer, owner, cliente vendedor y logout invalidan datos sin modificar perfil', () => {
	for (const tipo of ['buyer', 'owner', 'cliente', 'logout']) {
		const { store } = caso()
		store.commit('auth/setUser', { id: 2, email: 'prueba@example.test', name: 'Perfil' })
		store.commit('cart/set_buyer_field', { field: 'address', value: 'Vieja' })
		if (tipo === 'buyer') store.commit('auth/setUser', { id: 3 })
		if (tipo === 'owner') store.commit('commerce/setCommerce', { id: 1, owner_id: 99 })
		if (tipo === 'cliente') {
			store.commit('cart/set_buyer_id', 7)
			store.commit('cart/set_selected_buyer', { id: 7 })
			assert.equal(store.state.cart.buyer_id, 7)
		}
		if (tipo === 'logout') store.commit('auth/setUser', null)
		assert.equal(store.state.cart.buyer.address, '', tipo)
		assert.equal(store.state.cart.checkout_generation, 1, tipo)
		if (tipo !== 'buyer' && tipo !== 'logout') assert.equal(store.state.auth.user.name, 'Perfil')
	}
})
test('U2-05 identidad transitoria invitada preserva dirección y borrador', () => {
	const { store } = caso()
	store.commit('auth/setUser', { id: 2, email: 'prueba@example.test' })
	assert.equal(store.state.cart.buyer.address, 'Borrador')
	assert.equal(store.state.cart.checkout_generation, 0)
})
function prefill(store, api) {
	return new Vue({
		store, data: Buyer.data, computed: { buyer() { return store.state.cart.buyer }, commerce() { return store.state.commerce.commerce } },
		watch: Buyer.watch, methods: Buyer.methods, beforeCreate() { this.$api = api },
	})
}
test('U2-06 prefill tardío ignora email, generación y owner distintos', async () => {
	for (const cambio of ['email', 'generacion', 'owner']) {
		const { store } = caso()
		let resolver
		const vm = prefill(store, { post: () => new Promise(r => { resolver = r }) })
		store.commit('cart/set_buyer_field', { field: 'address', value: '' })
		vm.buscar_direccion_guardada()
		if (cambio === 'email') store.commit('cart/set_buyer_field', { field: 'email', value: 'otra@example.test' })
		if (cambio === 'generacion') store.commit('cart/reset_checkout')
		if (cambio === 'owner') store.commit('commerce/setCommerce', { id: 2, owner_id: 20 })
		resolver({ data: { found: true, address: 'Tardía' } })
		await new Promise(r => setImmediate(r))
		assert.equal(store.state.cart.buyer.address, '', cambio)
		vm.$destroy()
	}
})
test('U2-07 prefill legítimo completa vacíos y respeta edición manual', async () => {
	const { store } = caso()
	let resolver
	const vm = prefill(store, { post: () => new Promise(r => { resolver = r }) })
	vm.buscar_direccion_guardada()
	store.commit('cart/set_buyer_field', { field: 'address', value: 'Manual' })
	resolver({ data: { found: true, address: 'Guardada', ciudad: 'Ciudad' } })
	await new Promise(r => setImmediate(r))
	assert.equal(store.state.cart.buyer.address, 'Manual')
	assert.equal(store.state.cart.buyer.ciudad, 'Ciudad')
	vm.$destroy()
})
test('U2-08 direcciones de cuenta tardías no contaminan otra generación', async t => {
	const { store } = caso()
	const anterior = axios.defaults.adapter
	t.after(() => { axios.defaults.adapter = anterior })
	let resolver
	axios.defaults.adapter = config => new Promise(r => { resolver = data => r({ data, status: 200, headers: {}, config }) })
	const pendiente = store.dispatch('buyer_addresses/fetch')
	await new Promise(r => setImmediate(r))
	store.commit('commerce/setCommerce', { id: 2 })
	resolver({ models: [{ id: 5, street: 'Anterior' }] })
	await pendiente
	assert.equal(store.state.buyer_addresses.models.length, 0)
	assert.equal(store.state.buyer_addresses.loading, false)
})
test('U2-09 éxito tardío no borra el nuevo borrador', async () => {
	const { store, vm } = caso()
	let resolver
	vm.$api.post = () => new Promise(r => { resolver = r })
	const pendiente = vm.makeOrder(true)
	await new Promise(r => setImmediate(r))
	store.commit('cart/reset_checkout')
	store.commit('cart/set_buyer_field', { field: 'address', value: 'Nuevo' })
	resolver({ data: { order_id: 30 } })
	assert.equal(await pendiente, true)
	assert.equal(store.state.cart.buyer.address, 'Nuevo')
})
