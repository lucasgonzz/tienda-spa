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
function store() {
	return new Vuex.Store({ modules: {
		cart: { ...Cart.default, state: JSON.parse(JSON.stringify(Cart.default.state)), actions: { save() { return [] } } },
		commerce: { state: { commerce: { id: 1, owner_id: 10 } }, mutations: { owner(s, id) { s.commerce.owner_id = id } } },
		orders: { namespaced: true, state: { order: null }, actions: { getCurrentOrder() {} } },
		auth: { namespaced: true, state: { user: null, authenticated: false }, mutations: { setLoading() {}, setMessage() {}, setUser(s, u) { s.user = u }, user(s, u) { s.user = u } } },
	} })
}
function widget(t, get = () => Promise.resolve({ data: { captcha: enabled } })) {
	const s = store(), callbacks = [], removed = [], scripts = []
	global.window = { turnstile: { render(el, opts) { callbacks.push(opts); return callbacks.length }, remove(id) { removed.push(id) } } }
	global.document = { createElement() { return {} }, head: { appendChild(script) { scripts.push(script); script.parentNode = { removeChild() {} } } } }
	const vm = new Vue({ ...Captcha, store: s, beforeCreate() { this.$api = { get } } })
	vm.$refs.widget = {}
	let ready = false
	vm.$on('ready', value => { ready = value })
	vm.iniciar()
	t.after(() => { vm.$destroy(); delete global.window; delete global.document })
	return { s, vm, callbacks, removed, scripts, ready: () => ready }
}
test('apagado explícito no carga proveedor; autenticación genérica no exime verificación', async t => {
	let calls = 0
	const w = widget(t, () => { calls++; return Promise.resolve({ data: { captcha: { provider: 'turnstile', state: 'disabled', required: false } } }) })
	await tick()
	assert.equal(w.ready(), true)
	assert.equal(w.callbacks.length, 0)
	w.s.commit('cart/renovar_captcha')
	await tick()
	assert.equal(calls, 1)
	assert.equal(w.scripts.length, 0)
})
test('misconfiguración y fallo HTTP bloquean, conservan borrador y permiten retry explícito', async t => {
	let response = { ...enabled, state: 'misconfigured', site_key: null }
	const w = widget(t, () => response ? Promise.resolve({ data: { captcha: response } }) : Promise.reject(new Error('HTTP fake')))
	w.s.commit('cart/set_buyer_field', { field: 'address', value: 'Borrador' })
	await tick()
	assert.equal(w.ready(), false)
	assert.equal(w.vm.error, true)
	response = null
	w.vm.reintentar(); await tick()
	assert.equal(w.ready(), false)
	response = enabled
	w.vm.reintentar(); await tick()
	assert.equal(w.callbacks.length, 1)
	assert.equal(w.s.state.cart.buyer.address, 'Borrador')
})
test('token único, expiración, callback ajeno, renovación y cleanup real del componente', async t => {
	const w = widget(t); await tick()
	const old = w.callbacks[0]
	old.callback('token-fake')
	assert.equal(w.ready(), true)
	assert.equal(Cart.consumir_token_captcha(w.s.state), 'token-fake')
	old.callback('token-fake')
	assert.equal(Cart.consumir_token_captcha(w.s.state), null)
	old['expired-callback']()
	assert.equal(w.ready(), false)
	w.vm.reintentar(); await tick()
	old.callback('ajeno')
	assert.equal(w.ready(), false)
	w.callbacks[1].callback('nuevo')
	w.vm.$destroy()
	assert.equal(Cart.consumir_token_captcha(w.s.state), null)
	assert.equal(w.ready(), false)
	assert.deepEqual(w.removed, [1, 2])
})
test('owner/configuración tardía y sesión nueva no habilitan checkout', async t => {
	const resolvers = []
	const w = widget(t, () => new Promise(r => resolvers.push(r)))
	w.s.commit('owner', 99)
	resolvers[0]({ data: { captcha: { provider: 'turnstile', state: 'disabled', required: false } } })
	await tick()
	assert.equal(w.ready(), false)
	resolvers[1]({ data: { captcha: enabled } }); await tick()
	w.callbacks[0].callback('viejo')
	w.s.commit('cart/reset_checkout')
	assert.equal(Cart.consumir_token_captcha(w.s.state), null)
	assert.equal(w.ready(), false)
})
test('script sólo runtime habilitado; error de carga y timeout callback recuperables', async t => {
	const w = widget(t)
	delete window.turnstile
	await tick()
	assert.equal(w.scripts.length, 1)
	assert.match(w.scripts[0].src, /^https:\/\/challenges.cloudflare.com/)
	const script = w.scripts[0]
	script.onerror()
	assert.equal(w.vm.error, true)
	assert.equal(script.onload, null)
	assert.equal(script.onerror, null)
	assert.equal(w.ready(), false)
})
function order(s, post) {
	s.commit('cart/setCart', { id: 1, articles: [{ id: 1, pivot: { amount: 1 } }], promociones_vinoteca: [] })
	s.commit('cart/set_buyer_field', { field: 'address', value: 'Borrador' })
	const vm = { ...methods, $store: s, user: { id: 3 }, total: 50, canMakeOrder() { return true }, verificar_modo_del_pedido() {},
		$api: { post }, manejar_articulos_no_disponibles() { return false }, manejar_error_consulta_stock() { return false },
		manejar_error_de_direccion() { return false }, manejar_error_de_envio() { return false }, es_corte_por_articulos_no_disponibles() { return false } }
	Object.defineProperty(vm, 'cart', { get: () => s.state.cart.cart })
	return vm
}
test('POST orders exclusivamente, sin reutilización ante 422/503/429/genérico y sin borrar borrador', async () => {
	for (const status of [422, 503, 429, 500]) {
		const s = store(), requests = []
		const vm = order(s, (url, body) => { requests.push({ url, body }); return Promise.reject({ response: { status, data: { codigo: 'captcha_invalid' } } }) })
		Cart.recibir_token_captcha(s.state, Cart.contexto_captcha(s.state), 'consumible-fake')
		assert.equal(await vm.makeOrder(), null)
		assert.equal(await vm.makeOrder(), null)
		assert.equal(requests[0].url, '/orders')
		assert.equal(requests[0].body.captcha_token, 'consumible-fake')
		assert.equal(requests[1].body.captcha_token, undefined)
		assert.equal(s.state.cart.buyer.address, 'Borrador')
		assert.equal(s.state.cart.checkout_generation, 0)
		assert.equal(s.state.cart.captcha_revision, 2)
	}
})
test('identificación guest transitoria no exime ni pierde token; owner lo invalida aunque haya buyer_id', () => {
	const s = store()
	Cart.recibir_token_captcha(s.state, Cart.contexto_captcha(s.state), 'guest-fake')
	s.commit('auth/user', { id: 7, email: 'fake@example.test' })
	assert.equal(Cart.consumir_token_captcha(s.state), 'guest-fake')
	Cart.recibir_token_captcha(s.state, Cart.contexto_captcha(s.state), 'otro-fake')
	s.commit('owner', 20)
	assert.equal(Cart.consumir_token_captcha(s.state), null)
})
test('doble click en makeOrder no duplica POST y botón bloquea bypass sin verificación', async () => {
	const s = store(); let reject, calls = 0
	const vm = order(s, () => { calls++; return new Promise((r, j) => { reject = j }) })
	const pending = vm.makeOrder()
	assert.equal(await vm.makeOrder(), null)
	await tick(); assert.equal(calls, 1)
	reject(new Error('fake')); await pending
	let dispatched = 0
	const btn = { procesando: false, captcha_listo: false, ready() { dispatched++ } }
	Btn.methods.confirmar.call(btn)
	assert.equal(dispatched, 0)
	btn.captcha_listo = true
	Btn.methods.confirmar.call(btn)
	assert.equal(dispatched, 1)
})

const compiler = require('vue-template-compiler')
const VueRouter = require('vue-router')
Vue.use(VueRouter)
function compilado(component, file) {
	const template = compiler.parseComponent(fs.readFileSync(path.resolve(__dirname, '../src', file), 'utf8')).template.content
	assert.deepEqual(compiler.compile(template).errors, [], file)
	return { ...component, ...compiler.compileToFunctions(template) }
}
const Payway = compilado(load('components/payment-card/components/Payway.vue').default, 'components/payment-card/components/Payway.vue')
const CaptchaRender = compilado(Captcha, 'components/payment/components/CheckoutCaptcha.vue')
const BtnRender = compilado(Btn, 'components/payment/components/BtnSave.vue')
const CardView = compilado(load('views/PaymentCard.vue').default, 'views/PaymentCard.vue')
// La vista Payment real conserva su template/hook de navegación. Los paneles
// ajenos al envío son dobles; CartResume aloja el BtnSave real bajo prueba.
function vistaPayment() {
	const file = 'views/Payment.vue'
	const source = compiler.parseComponent(fs.readFileSync(path.resolve(__dirname, '../src', file), 'utf8')).script.content
	const code = babel.transformSync(source, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code
	const mod = { exports: {} }
	new Function('require', 'module', 'exports', code)(name => {
		if (name === '@/utils/tracking') return { trackear() {}, TIPOS_EVENTO: {} }
		if (name.startsWith('@/helpers/')) return load(name.slice(2))
		return { render: h => h('div') }
	}, mod, mod.exports)
	return compilado(mod.exports.default, file)
}
const PaymentView = vistaPayment()
// Parche DOM mínimo: Vue mantiene componentes, hooks, refs y Router reales.
// No simula el código del checkout ni acredita renderizado visual en navegador.
function parche(old, vnode) {
	function destruir(n) {
		if (!n) return
		if (n.componentInstance) n.componentInstance.$destroy()
		else (n.children || []).forEach(destruir)
	}
	if (!vnode) { destruir(old); return }
	if (old && old.tag !== vnode.tag) { destruir(old); old = null }
	if (vnode.componentOptions) {
		if (old && old.componentInstance) vnode.data.hook.prepatch(old, vnode)
		else { vnode.data.hook.init(vnode, false); vnode.data.hook.insert(vnode) }
		vnode.elm = vnode.componentInstance.$el
	} else {
		vnode.elm = old && old.elm || { querySelector() { return {} }, focus() {}, scrollIntoView() {} }
		const anteriores = old && old.children || []
		;(vnode.children || []).forEach((child, i) => parche(anteriores[i], child))
		anteriores.slice((vnode.children || []).length).forEach(destruir)
	}
	if (vnode.data && vnode.data.ref) vnode.context.$refs[vnode.data.ref] = vnode.elm
	return vnode.elm
}
function descendientes(vm) { return [vm, ...vm.$children.flatMap(descendientes)] }
function montarFlujo(t, config = enabled, guest = false) {
	const s = store(), callbacks = [], requests = [], sdk = [], messages = []
	let rejectOrder = true, identificar, rechazarBuyer
	if (guest) {
		s.state.delivery_day = { models: [] }
	}
	global.window = { turnstile: { render(el, opts) { callbacks.push(opts); return callbacks.length }, remove() {} }, Decidir: function() {
		this.setPublishableKey = function() {}; this.setTimeout = function() {}
		this.createToken = function(form, callback) { sdk.push(callback) }
	} }
	const api = { get() { return Promise.resolve({ data: { captcha: config } }) }, post(url, body) {
		requests.push({ url, body })
		if (url === 'buyer') return new Promise((resolve, reject) => { identificar = resolve; rechazarBuyer = reject })
		if (url === 'payment-card-info') return Promise.resolve({ data: { model: { id: 80 } } })
		if (rejectOrder) return Promise.reject({ response: { status: 422, data: { codigo: 'captcha_invalid' } } })
		return Promise.resolve({ data: { order_id: 90 } })
	} }
	const transient = { render(h) { return h('div', this.$slots.default) } }
	const componentes = { 'b-button': transient, 'b-row': transient, 'b-col': transient }
	const BtnTest = { ...BtnRender, components: { ...componentes, CheckoutCaptcha: CaptchaRender },
		computed: { ...Btn.computed, is_payway() { return true }, pedido_a_consultar() { return false }, is_mp() { return false } },
		methods: { ...Btn.methods, check() { return true } },
		...(guest ? {
			computed: { ...Btn.computed, is_payway() { return true }, pedido_a_consultar() { return false }, is_mp() { return false },
				cart() { return s.state.cart.cart }, authenticated() { return false }, puede_comprar_sin_login() { return true },
				user() { return s.state.auth.user }, commerce() { return { id: 1, online_configuration: {} } },
				payment_methods() { return [{}] }, cart_payment_method() { return { id: 1 } },
				direcciones_de_envio_activas() { return false }, envio_zipnova_elegido() { return false } },
			methods: { ...Btn.methods, flag_activo() { return false } },
		} : {}),
	}
	const PayTest = { ...Payway, components: { ...componentes, CheckoutCaptcha: CaptchaRender },
		computed: { cart() { return s.state.cart.cart }, installments() { return [] }, payment_methods() { return [] }, total() { return 50 }, user() { return guest ? s.state.auth.user : { id: 3 } } },
		methods: { ...Payway.methods, canMakeOrder() { return true }, verificar_modo_del_pedido() {},
			manejar_articulos_no_disponibles() { return false }, manejar_error_consulta_stock() { return false },
			manejar_error_de_direccion() { return false }, manejar_error_de_envio() { return false },
			es_corte_por_articulos_no_disponibles() { return false }, deleteCartAfterOrder() {}, logoutGuestAfterOrder() {} } }
	const router = new VueRouter({ mode: 'abstract', routes: [
		{ path: '/pedido', name: 'Payment', component: { ...PaymentView,
			components: { ...Object.fromEntries(Object.keys(PaymentView.components).map(name => [name, transient])), ...componentes, CartResume: { render: h => h(BtnTest) } },
			computed: { pedido_a_consultar() { return false }, comprador_invitado() { return true }, direcciones_de_envio_activas() { return false } },
			methods: { setTitle() {} },
		} },
		{ path: '/tarjeta', name: 'PaymentCard', component: { ...CardView, components: { ...componentes, Payway: PayTest }, computed: { pedido_a_consultar() { return false } } } },
		{ path: '/gracias', name: 'Thanks', component: transient },
	] })
	const previousPatch = Vue.prototype.__patch__
	Vue.prototype.__patch__ = parche
	const app = new Vue({ router, store: s, render: h => h('router-view') })
	const previousApi = Vue.prototype.$api, previousToast = Vue.prototype.$toast
	Vue.prototype.$api = api; Vue.prototype.$toast = { error(m) { messages.push(m) } }
	app.$mount()
	s.commit('cart/setCart', { id: 1, articles: [{ id: 1, pivot: { amount: 1 } }], promociones_vinoteca: [] })
	s.commit('cart/set_buyer_field', { field: 'address', value: 'Borrador' })
	if (guest) {
		s.state.cart.cart.deliver = 0
		for (const [field, value] of Object.entries({ name: 'Invitado', email: 'guest@example.test', phone: '123', ciudad: 'Córdoba' })) s.commit('cart/set_buyer_field', { field, value })
	}
	t.after(() => { app.$destroy(); Vue.prototype.__patch__ = previousPatch; Vue.prototype.$api = previousApi; Vue.prototype.$toast = previousToast; delete global.window })
	return { s, app, router, callbacks, requests, sdk, messages, find: name => descendientes(app).find(vm => vm.$options.methods && vm.$options.methods[name]), success() { rejectOrder = false }, identificar(response = { data: { model: { id: 7 } } }) { identificar(response) }, rechazarBuyer() { rechazarBuyer(new Error('HTTP fake')) } }
}
test('Payment → PaymentCard con Vue/Router y Payway reales: desmonta token, bloquea invitado, renueva y reintenta sin duplicar tarjeta/pedido', async t => {
	const f = montarFlujo(t)
	await f.router.push({ name: 'Payment' }); await tick()
	f.callbacks[0].callback('pantalla-payment')
	await Vue.nextTick()
	const btn = f.find('confirmar')
	btn.confirmar()
	await tick()
	assert.equal(f.router.currentRoute.name, 'PaymentCard')
	assert.equal(btn._isDestroyed, true)
	assert.equal(Cart.consumir_token_captcha(f.s.state), null, 'no transporta token entre pantallas')
	const pay = f.find('sendForm')
	assert.ok(pay)
	assert.equal(pay.captcha_listo, false)
	pay.selected_installments = 1
	assert.equal(await pay.sendForm(), null)
	assert.equal(f.sdk.length, 0)
	f.callbacks[1].callback('pantalla-tarjeta')
	await Vue.nextTick()
	const first = pay.sendForm()
	assert.equal(await pay.sendForm(), null)
	await tick()
	assert.equal(f.sdk.length, 1)
	f.sdk[0](200, { id: 'sdk-fake', bin: 'fake' })
	f.sdk[0](200, { id: 'duplicado', bin: 'fake' })
	assert.equal(await first, null)
	await tick()
	assert.equal(pay.procesando, false)
	assert.equal(pay.captcha_listo, false)
	assert.equal(pay.numero_tarjeta, '4507990000004905')
	assert.equal(f.s.state.cart.buyer.address, 'Borrador')
	assert.deepEqual(f.requests.map(r => r.url), ['payment-card-info', '/orders'])
	assert.equal(f.requests[1].body.captcha_token, 'pantalla-tarjeta')
	assert.equal(f.requests[0].body.captcha_token, undefined)
	f.callbacks.at(-1).callback('renovado')
	await Vue.nextTick()
	f.success()
	assert.equal(await pay.sendForm(), true)
	await tick()
	assert.equal(f.requests.filter(r => r.url === 'payment-card-info').length, 1)
	assert.equal(f.requests.filter(r => r.url === '/orders').length, 2)
	assert.equal(f.requests.at(-1).body.captcha_token, 'renovado')
	assert.equal(f.router.currentRoute.name, 'Thanks')
	assert.equal(f.s.state.cart.buyer.address, '')
	assert.equal(Cart.consumir_token_captcha(f.s.state), null)
})
test('Payway real: misconfigured fail-closed y disabled explícito sin cargar Turnstile', async t => {
	for (const config of [{ ...enabled, state: 'misconfigured' }, { provider: 'turnstile', state: 'disabled', required: false }]) {
		await t.test(config.state, async t => {
			const f = montarFlujo(t, config)
			await f.router.push({ name: 'PaymentCard' }); await tick()
			const pay = f.find('sendForm')
			assert.equal(pay.captcha_listo, config.state === 'disabled')
			assert.equal(f.callbacks.length, 0)
			assert.equal(f.requests.length, 0)
		})
	}
})
test('Payway real: expiración durante SDK y respuesta tras desmontar no guardan tarjeta ni crean pedido', async t => {
	for (const salir of [false, true]) {
		await t.test(salir ? 'desmontaje' : 'expiración', async t => {
			const f = montarFlujo(t)
			await f.router.push({ name: 'PaymentCard' }); await tick()
			const pay = f.find('sendForm')
			pay.selected_installments = 1
			f.callbacks[0].callback('token-fake'); await Vue.nextTick()
			const pending = pay.sendForm(); await tick()
			if (salir) await f.router.push({ name: 'Thanks' })
			else f.callbacks[0]['expired-callback']()
			f.sdk[0](200, { id: 'sdk-tardio' })
			assert.equal(await pending, null)
			assert.equal(f.requests.length, 0)
			assert.equal(Cart.consumir_token_captcha(f.s.state), null)
			assert.equal(f.s.state.cart.buyer.address, 'Borrador')
			assert.equal(pay.numero_tarjeta, '4507990000004905')
			if (!salir) {
				const captcha = f.find('reintentar')
				captcha.reintentar(); await tick()
				f.callbacks.at(-1).callback('renovado'); await Vue.nextTick()
				assert.equal(pay.captcha_listo, true)
			}
		})
	}
})
test('Payway real: error SDK libera botón y renueva sin guardar ni vaciar formulario', async t => {
	const f = montarFlujo(t)
	await f.router.push({ name: 'PaymentCard' }); await tick()
	const pay = f.find('sendForm')
	pay.selected_installments = 1
	f.callbacks[0].callback('token-fake'); await Vue.nextTick()
	const pending = pay.sendForm(); await tick()
	f.sdk[0](400, { error: [] })
	assert.equal(await pending, null)
	await tick()
	assert.equal(pay.procesando, false)
	assert.equal(pay.captcha_listo, false)
	assert.equal(f.requests.length, 0)
	assert.equal(f.s.state.cart.buyer.address, 'Borrador')
	assert.equal(pay.selected_installments, 1)
	assert.equal(f.callbacks.length, 2)
})

// QA1: métodos reales, sin sustituir check/ready ni los validadores del invitado.
function botonGuest(post) {
 const s = store(), navigations = [], errors = []
 const vm = { ...Btn.methods, $store: s, procesando: false, captcha_listo: true,
  authenticated: false, puede_comprar_sin_login: true, user: null,
  commerce: { id: 1, online_configuration: {} }, payment_methods: [{}], cart_payment_method: { id: 1 },
  direcciones_de_envio_activas: false, envio_zipnova_elegido: false, pedido_a_consultar: false,
  flag_activo() { return false }, $api: { post },
  $router: { push(route) { navigations.push(route.name); return Promise.resolve() } },
  $toast: { error(message) { errors.push(message) } },
 }
 s.state.delivery_day = { models: [] }
 s.commit('cart/setCart', { id: 1, deliver: 0, articles: [], promociones_vinoteca: [] })
 Object.defineProperty(vm, 'cart', { get: () => s.state.cart.cart })
 for (const [field, value] of Object.entries({ name: 'Invitado', email: 'guest@example.test', phone: '123', ciudad: 'Córdoba', address: 'Borrador' })) s.commit('cart/set_buyer_field', { field, value })
 return { vm, s, navigations, errors }
}
test('QA1 guest null: check valida sus datos y Payway identifica una sola vez antes de navegar', async () => {
 let resolve, calls = 0
 const f = botonGuest((url) => { assert.equal(url, 'buyer'); calls++; return new Promise(r => { resolve = r }) })
 assert.equal(f.vm.check(), true)
 f.vm.payway(); f.vm.payway()
 assert.equal(calls, 1)
 assert.equal(f.vm.procesando, true)
 assert.deepEqual(f.navigations, [])
 resolve({ data: { model: { id: 7 } } }); await tick()
 assert.deepEqual(f.navigations, ['PaymentCard'])
 assert.equal(f.vm.procesando, false)
 assert.equal(f.s.state.auth.user.id, 7)
})
test('QA1 guest incompleto no navega ni identifica ni borra borrador', () => {
 let calls = 0
 const f = botonGuest(() => { calls++ })
 f.s.commit('cart/set_buyer_field', { field: 'name', value: '' })
 assert.equal(f.vm.check(), false)
 f.vm.payway()
 assert.equal(calls, 0)
 assert.deepEqual(f.navigations, [])
 assert.equal(f.vm.procesando, false)
 assert.equal(f.s.state.cart.buyer.address, 'Borrador')
 assert.match(f.errors[0], /Nombre/)
})
test('QA1 buyer error o respuesta incompleta libera y conserva, sin navegación ni pedido', async () => {
 for (const response of [null, {}, { data: { model: {} } }]) {
  const f = botonGuest(() => response ? Promise.resolve(response) : Promise.reject(new Error('HTTP fake')))
  f.vm.payway(); await tick()
  assert.equal(f.vm.procesando, false)
  assert.deepEqual(f.navigations, [])
  assert.equal(f.s.state.cart.buyer.address, 'Borrador')
  assert.equal(f.s.state.auth.user, null)
  assert.match(f.errors[0], /identificar/)
 }
})
test('QA1 action publicada válida distinta checkout se pasa al proveedor', async t => {
 const w = widget(t, () => Promise.resolve({ data: { captcha: { ...enabled, action: 'compra' } } }))
 await tick()
 assert.equal(w.callbacks.length, 1)
 assert.equal(w.callbacks[0].action, 'compra')
 w.callbacks[0].callback('compra-fake')
 assert.equal(w.ready(), true)
})
test('QA1 action malformada falla cerrado sin proveedor ni borrar borrador', async t => {
 for (const action of [undefined, null, '', ' ', 'compra inválida', 'compra/pago', 'compra\n', 'a'.repeat(33), {}, 7]) {
  await t.test(String(action), async t => {
   const w = widget(t, () => Promise.resolve({ data: { captcha: { ...enabled, action } } }))
   w.s.commit('cart/set_buyer_field', { field: 'address', value: 'Borrador' })
   await tick()
   assert.equal(w.ready(), false)
   assert.equal(w.vm.error, true)
   assert.equal(w.callbacks.length, 0)
   assert.equal(w.s.state.cart.buyer.address, 'Borrador')
  })
 }
})

test('QA1 guest user=null → buyer → PaymentCard → CAPTCHA nuevo → un único pedido real', async t => {
 const f = montarFlujo(t, enabled, true)
 await f.router.push({ name: 'Payment' }); await tick()
 assert.equal(f.s.state.auth.user, null)
 f.callbacks[0].callback('payment-viejo'); await Vue.nextTick()
 const btn = f.find('confirmar')
 btn.confirmar(); btn.confirmar(); await tick()
 assert.equal(f.router.currentRoute.name, 'Payment')
 assert.equal(f.sdk.length, 0)
 assert.deepEqual(f.requests.map(r => r.url), ['buyer'])
 assert.equal(f.s.state.cart.cuotas_bloqueadas, true)
 f.identificar(); await tick()
 assert.equal(f.router.currentRoute.name, 'PaymentCard')
 assert.equal(btn._isDestroyed, true)
 assert.equal(f.s.state.auth.user.id, 7)
 assert.equal(f.s.state.cart.cuotas_bloqueadas, false)
 assert.equal(Cart.consumir_token_captcha(f.s.state), null)
 const pay = f.find('sendForm')
 pay.selected_installments = 1
 assert.equal(await pay.sendForm(), null)
 assert.equal(f.sdk.length, 0)
 f.callbacks.at(-1).callback('tarjeta-nuevo'); await Vue.nextTick()
 f.success()
 const pending = pay.sendForm()
 assert.equal(await pay.sendForm(), null)
 await tick()
 assert.equal(f.sdk.length, 1)
 f.sdk[0](200, { id: 'sdk-fake', bin: 'fake' })
 f.sdk[0](200, { id: 'duplicado', bin: 'fake' })
 assert.equal(await pending, true); await tick()
 assert.deepEqual(f.requests.map(r => r.url), ['buyer', 'payment-card-info', '/orders'])
 assert.equal(f.requests.at(-1).body.captcha_token, 'tarjeta-nuevo')
 assert.equal(f.router.currentRoute.name, 'Thanks')
 assert.equal(f.s.state.cart.buyer.address, '')
})

test('QA1 Payment guest: error/incompleto buyer conserva borrador, libera candado y no tokeniza', async t => {
 for (const modo of ['http', 'incompleto']) {
  await t.test(modo, async t => {
   const f = montarFlujo(t, enabled, true)
   await f.router.push({ name: 'Payment' }); await tick()
   f.callbacks[0].callback('payment-fake'); await Vue.nextTick()
   const btn = f.find('confirmar')
   btn.confirmar(); await tick()
   if (modo === 'http') f.rechazarBuyer()
   else f.identificar({ data: { model: {} } })
   await tick()
   assert.equal(btn.procesando, false)
   assert.equal(f.s.state.cart.cuotas_bloqueadas, false)
   assert.equal(f.s.state.cart.buyer.address, 'Borrador')
   assert.equal(f.router.currentRoute.name, 'Payment')
   assert.equal(f.s.state.auth.user, null)
   assert.equal(f.sdk.length, 0)
   assert.deepEqual(f.requests.map(r => r.url), ['buyer'])
   assert.match(f.messages[0], /identificar/)
  })
 }
})
