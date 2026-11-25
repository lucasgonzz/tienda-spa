/*
 * Misión tienda-cobro-tarjeta, CA21 y CA22: cobro con tarjeta DENTRO del checkout de la tienda.
 *
 * Qué fija (componentes reales de la tienda, montados con Vue 2 + Vuex reales y el template compilado):
 *  CA21  Con el método de tipo «Tarjeta Mercado Pago» elegido el comprador ve SOLO el valor de cada cuota que
 *        calculó el servidor (POST /mercado-pago/tarjeta/montos), nunca el «Total financiado». Al pagar, el POST va
 *        a /mercado-pago/tarjeta/pagar con el token del Brick (nunca número ni CVV), la cantidad de cuotas y el
 *        monto que se le mostró. 201 lleva a Thanks; un rechazo muestra el mensaje del servidor, deja el botón
 *        libre, renueva el CAPTCHA y permite reintentar; una API vieja (404) avisa y no deja pagar.
 *  CA22  Bloque B: el Subtotal del checkout lleva el recargo de la tienda (online_price_surchage) y los totales
 *        coinciden con lo que cobra el servidor (con transferencia al 10 %: $104.500).
 *
 * Mercado Pago se falsea de punta a punta: `window.MercadoPago` es un doble con un Brick simulado (`getFormData`)
 * y axios se intercepta (adaptador). Nunca hay red. La mirada en el navegador (CA24) la hace el Coordinador.
 *
 * Nombres de la implementación que estos tests asumen (salen de PLAN.md §2 tienda-spa):
 *  - componente `components/payment/components/payment-method/CardPaymentMethod.vue` (ya existe) que monta el
 *    nuevo `tarjeta-mercado-pago/` cuando el tipo del método es «Tarjeta Mercado Pago»;
 *  - el botón `BtnSave.vue` (ya existe) y su método `confirmar()`;
 *  - `makeOrder` del mixin cart.js hace el POST de pago;
 *  - el resto se verifica por lo que ve el comprador (textos) y por lo que viaja por la red.
 */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const babel = require('@babel/core')
const compiler = require('vue-template-compiler')
const Vue = require('vue')
const Vuex = require('vuex')
const axios = require('axios')

Vue.use(Vuex)
Vue.config.productionTip = false
Vue.config.warnHandler = () => {}

// El store de la tienda deja console.log de depuración al guardar el carrito: se callan para leer los resultados.
console.log = function() {}

const raiz = path.resolve(__dirname, '..')
const cache = new Map()

/** Carga un módulo de src/ (js o .vue con su template compilado) con babel, sin webpack. */
function cargar(nombre, desde) {
	if (nombre === '@/utils/tracking') return { trackear() {}, enviar_cola() {}, TIPOS_EVENTO: {} }
	if (nombre === 'vue-load-image') return {}
	let archivo
	if (nombre.startsWith('@/')) archivo = path.join(raiz, 'src', nombre.slice(2))
	else if (nombre.startsWith('.')) archivo = path.resolve(path.dirname(desde), nombre)
	else return require(nombre)
	const sin_extension = !path.extname(archivo)
	if (sin_extension) archivo += fs.existsSync(archivo + '.js') ? '.js' : '.vue'
	if (!fs.existsSync(archivo)) throw new Error('No existe el módulo ' + path.relative(raiz, sin_extension ? archivo.replace(/\.vue$/, '') : archivo) + ' (lo tiene que crear la implementación)')
	if (cache.has(archivo)) return cache.get(archivo).exports
	let fuente = fs.readFileSync(archivo, 'utf8')
	let compilado = null
	if (archivo.endsWith('.vue')) {
		const sfc = compiler.parseComponent(fuente)
		fuente = sfc.script ? sfc.script.content : 'export default {}'
		if (sfc.template) {
			assert.deepEqual(compiler.compile(sfc.template.content).errors, [], archivo)
			compilado = compiler.compileToFunctions(sfc.template.content)
		}
	}
	const codigo = babel.transformSync(fuente, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code
	const modulo = { exports: {} }
	cache.set(archivo, modulo)
	new Function('require', 'module', 'exports', codigo)(n => cargar(n, archivo), modulo, modulo.exports)
	if (compilado && modulo.exports.default) Object.assign(modulo.exports.default, compilado)
	return modulo.exports
}
const src = ruta => cargar('@/' + ruta)

// Mixins globales de la app (main.js los registra con Vue.mixin): precios, helpers y datos del store.
Vue.mixin(src('mixins/dates').default)
Vue.mixin(src('mixins/generals').default)

const Cart = src('store/cart')
const CardPaymentMethod = () => src('components/payment/components/payment-method/CardPaymentMethod.vue').default
const Total = () => src('components/payment/components/payment-method/Total.vue').default
const BtnSave = () => src('components/payment/components/BtnSave.vue').default

// ---------------------------------------------------------------------------------------------------------------
// Datos del escenario E1 (PLAN.md §6)
// ---------------------------------------------------------------------------------------------------------------

const CART_ID = 77
const PUBLIC_KEY = 'TEST-PK-C'

/** Lo que responde el servidor a /montos para E1: recargo de tienda 5, envío 10.000, cuotas 3 (+10 %) y 6 (+20 %). */
const OPCIONES = [
	{ cuotas: 1, valor_cuota: 115000.00, total: 115000.00 },
	{ cuotas: 3, valor_cuota: 42166.67, total: 126500.00 },
	{ cuotas: 6, valor_cuota: 23000.00, total: 138000.00 },
]
const TARJETA = {
	id: 5, name: 'Tarjeta de crédito o débito', description: null, discount: null, surchage: null,
	public_key: PUBLIC_KEY, type: { id: 9, name: 'Tarjeta Mercado Pago' },
	cuotas_disponibles: [{ cantidad_cuotas: 3, recargo: '10.00' }, { cantidad_cuotas: 6, recargo: '20.00' }],
}
const TRANSFERENCIA = { id: 2, name: 'Transferencia', description: null, discount: '10.00', surchage: null, type: { id: 3, name: 'Transferencia' } }
const MERCADO_PAGO = {
	id: 7, name: 'Mercado Pago', description: null, discount: null, surchage: null, public_key: 'TEST-PK-C', type: { id: 1, name: 'MercadoPago' },
	cuotas_disponibles: [{ cantidad_cuotas: 3, recargo: '10.00' }],
}

/** Carrito de E1: un artículo a 100.000 (contado), con envío a domicilio por zona propia de 10.000. */
function carrito_e1(deliver = 1) {
	return { id: CART_ID, total: '100000.00', deliver, description: '', payment_id: '', payment_status: '', address_id: '', payment_card_info_id: null,
		fecha_entrega: 0, envio: null, articles: [{ id: 1, name: 'Artículo A', pivot: { amount: 1, price: 100000 } }], promociones_vinoteca: [], combos: [] }
}

// ---------------------------------------------------------------------------------------------------------------
// Parche mínimo de DOM (mismo criterio que checkout-captcha.test.cjs): Vue mantiene componentes, hooks,
// reactividad y refs reales; el elemento es un doble. Con él se monta el árbol completo y se lee lo que ve el comprador.
// ---------------------------------------------------------------------------------------------------------------

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

/** Texto visible de un vnode (baja por los componentes hijos), con los espacios colapsados. */
function texto_de(vnode) {
	if (!vnode) return ''
	if (vnode.componentInstance) return texto_de(vnode.componentInstance._vnode)
	if (vnode.isComment) return ''
	if (vnode.tag === undefined && typeof vnode.text === 'string') return vnode.text
	return (vnode.children || []).map(texto_de).join(' ')
}
const texto = vm => texto_de(vm._vnode).replace(/\s+/g, ' ').trim()

/**
 * Busca lo que el comprador tocaría para elegir una opción con ese texto y lo dispara: el elemento más
 * específico cuyo texto contiene `buscado` y que tiene un manejador click/change/input. Para un `<input>` cuenta
 * el texto de su contenedor (radio dentro de un label).
 */
function tocar(vm, buscado) {
	const candidatos = []
	;(function recorrer(vnode, padre) {
		if (!vnode) return
		if (vnode.componentInstance) { recorrer(vnode.componentInstance._vnode, padre); return }
		const on = vnode.data && (vnode.data.on || vnode.data.nativeOn)
		if (on && (on.click || on.change || on.input)) {
			const propio = texto_de(vnode).replace(/\s+/g, ' ')
			const base = vnode.tag === 'input' && padre ? texto_de(padre).replace(/\s+/g, ' ') : propio
			if (base.includes(buscado)) candidatos.push({ on, largo: base.length })
		}
		;(vnode.children || []).forEach(h => recorrer(h, vnode))
	})(vm._vnode, null)
	assert.ok(candidatos.length, 'no hay nada tocable que diga «' + buscado + '». Se ve: ' + texto(vm))
	candidatos.sort((a, b) => a.largo - b.largo)
	const manejador = candidatos[0].on.click || candidatos[0].on.change || candidatos[0].on.input
	;[].concat(manejador).forEach(f => f({ type: 'click', target: { checked: true }, preventDefault() {}, stopPropagation() {} }))
}

const tick = () => new Promise(r => setImmediate(r))
/** Deja correr las cadenas de promesas y los re-render (el cobro y la carga de montos encadenan varias). */
async function esperar() { for (let i = 0; i < 8; i++) await tick() }

// ---------------------------------------------------------------------------------------------------------------
// Entorno de cada test: store real, axios interceptado, Mercado Pago falso con su Brick simulado.
// ---------------------------------------------------------------------------------------------------------------

/**
 * Arma todo lo que rodea al componente bajo prueba y lo deshace al terminar el test.
 *
 * @param {object} t Contexto del test (para t.after).
 * @param {object} cfg
 *   - metodos: lista de métodos de pago de la tienda (store payment_methods).
 *   - elegido: método elegido en el checkout (o null).
 *   - recargo_tienda: online_price_surchage del comercio.
 *   - cart: carrito (por defecto el de E1).
 *   - zona: zona de envío propia elegida (por defecto 10.000).
 *   - forma_brick: 'plano' (getFormData devuelve los campos) o 'envuelto' ({ formData: {...} }).
 * @returns {object} ctx con store, requests, toasts, pushes, brick, respuestas y montar().
 */
function entorno(t, cfg = {}) {
	const { metodos = [TARJETA, TRANSFERENCIA, MERCADO_PAGO], elegido = null, recargo_tienda = 5, forma_brick = 'plano' } = cfg
	const requests = [], toasts = [], pushes = [], raices = []
	const guardados = { cantidad: 0 }
	// Respuestas que arma el servidor falso. `pagar` es una cola: cada POST de pago consume una; si no queda, 201.
	const respuestas = {
		montos: () => ({ status: 200, data: { opciones: OPCIONES } }),
		pagar: [],
		orders: () => ({ status: 200, data: { order_id: 90 } }),
	}
	/** Resuelve cualquier request (axios del store o $api del mixin) contra el servidor falso. */
	function atender(metodo, url, body) {
		const limpia = String(url).replace(/^https?:\/\/[^/]+/, '').replace(/^\/?api\//, '').replace(/^\/+/, '')
		requests.push({ metodo: metodo.toLowerCase(), url: limpia, body })
		if (limpia === 'mercado-pago/tarjeta/montos') return respuestas.montos(body)
		if (limpia === 'mercado-pago/tarjeta/pagar') return respuestas.pagar.length ? respuestas.pagar.shift()(body) : { status: 201, data: { order_id: 90 } }
		if (limpia === 'orders') return respuestas.orders(body)
		return { status: 200, data: {} }
	}
	function como_axios(metodo, url, body) {
		const r = atender(metodo, url, body)
		if (r.status >= 400) return Promise.reject({ response: { status: r.status, data: r.data }, message: 'HTTP ' + r.status })
		return Promise.resolve({ status: r.status, data: r.data })
	}
	const adaptador_previo = axios.defaults.adapter
	axios.defaults.adapter = config => como_axios(config.method, config.url, typeof config.data === 'string' ? JSON.parse(config.data) : config.data)
		.then(res => ({ ...res, statusText: 'OK', headers: {}, config }), err => Promise.reject(Object.assign(err, { config })))
	const api = {
		get: (url) => como_axios('get', url), post: (url, body) => como_axios('post', url, body),
		put: (url, body) => como_axios('put', url, body), delete: (url) => como_axios('delete', url),
	}

	// Brick simulado de Mercado Pago (Card Payment Brick): sólo existe lo que la tienda usa.
	const brick = { instancias: [], creados: [], desmontados: 0, llamadas_a_form_data: 0, tokens: ['tok_1', 'tok_2', 'tok_3', 'tok_4'] }
	function MercadoPagoFalso(public_key, opciones) {
		brick.instancias.push({ public_key, opciones })
		this.bricks = function() {
			return {
				create(tipo, id, settings) {
					brick.creados.push({ tipo, id, settings })
					const controlador = {
						getFormData() {
							brick.llamadas_a_form_data++
							const datos = { token: brick.tokens.shift(), issuer_id: '310', payment_method_id: 'visa', transaction_amount: 1, installments: 1,
								payer: { email: 'comprador@example.test', identification: { type: 'DNI', number: '30123456' } } }
							return Promise.resolve(forma_brick === 'envuelto' ? { formData: datos } : datos)
						},
						unmount() { brick.desmontados++ },
					}
					if (settings && settings.callbacks && settings.callbacks.onReady) Promise.resolve().then(() => settings.callbacks.onReady())
					return Promise.resolve(controlador)
				},
			}
		}
	}
	const previos = {
		patch: Vue.prototype.__patch__, api: Vue.prototype.$api, toast: Vue.prototype.$toast, router: Vue.prototype.$router,
		window: global.window, mp: global.MercadoPago, localStorage: global.localStorage,
	}
	Vue.prototype.__patch__ = parche
	Vue.prototype.$api = api
	Vue.prototype.$toast = { error(m) { toasts.push(String(m)) }, warning(m) { toasts.push(String(m)) }, success() {} }
	Vue.prototype.$router = { push(destino) { pushes.push(destino); return Promise.resolve() } }
	global.MercadoPago = MercadoPagoFalso
	// El mixin global de generals.js lee window.innerWidth y escucha 'resize' al crear cada componente.
	global.window = { MercadoPago: MercadoPagoFalso, __CC_CONFIG__: {}, innerWidth: 1280, addEventListener() {}, removeEventListener() {} }

	// Store: el módulo cart es el real (con su estado propio); sólo se simula el guardado del carrito.
	const store = new Vuex.Store({ modules: {
		cart: { ...Cart.default, state: JSON.parse(JSON.stringify(Cart.default.state)),
			actions: { ...Cart.default.actions, save() { guardados.cantidad++; return [] } } },
		commerce: { state: { commerce: { id: 1, owner_id: 10, name: 'Masquito', consultas_de_stock: false, online_configuration: { online_price_surchage: recargo_tienda, register_to_buy: 0 } }, workdays: [] },
			actions: { getCommerce() {} } },
		auth: { namespaced: true, state: { user: { id: 3, seller_id: null, email: 'comprador@example.test' }, authenticated: true }, mutations: { setLoading() {}, setMessage() {}, setUser() {} } },
		orders: { namespaced: true, state: { order: null }, actions: { getCurrentOrder() {} } },
		payment_methods: { namespaced: true, state: { models: metodos, loading: false } },
		delivery_zones: { namespaced: true, state: { models: [] } },
		articles: { namespaced: true, state: { articles: [] } },
		coins: { state: { dolar: { compra: 1, venta: 1 } } },
	} })
	store.commit('cart/setCart', cfg.cart || carrito_e1())
	if (cfg.zona !== null) store.commit('cart/setDeliveryZone', cfg.zona || { id: 1, name: 'Zona propia', price: '10000.00' })
	if (elegido) store.commit('cart/setPaymentMethod', elegido)

	const ctx = {
		store, requests, toasts, pushes, brick, respuestas, guardados,
		/** Monta un componente real con sus props; devuelve el vm raíz del componente (hijo del host). */
		montar(componente, props = {}) {
			const host = new Vue({ store, render: h => h(componente, { props }) })
			host.$mount()
			raices.push(host)
			host.componente = host.$children[0]
			return host
		},
		/** Pedidos POST de pago / de creación de pedido ya hechos. */
		posts_a(url) { return requests.filter(r => r.metodo === 'post' && r.url === url) },
	}
	t.after(() => {
		raices.forEach(r => { try { r.$destroy() } catch (e) { /* ya destruido */ } })
		axios.defaults.adapter = adaptador_previo
		Vue.prototype.__patch__ = previos.patch
		Vue.prototype.$api = previos.api
		Vue.prototype.$toast = previos.toast
		Vue.prototype.$router = previos.router
		if (previos.window === undefined) delete global.window; else global.window = previos.window
		if (previos.mp === undefined) delete global.MercadoPago; else global.MercadoPago = previos.mp
	})
	return ctx
}

// Dobles de componentes de bootstrap-vue y del CAPTCHA (no son lo que se prueba: el CAPTCHA tiene sus propios tests).
const pasa_contenido = { render(h) { return h('div', this.$slots.default) } }
const captcha_listo = { render: h => h('span'), created() { this.$emit('ready', true) } }

/** El botón real de confirmar (BtnSave.vue + el mixin cart.js reales) con el CAPTCHA listo y los b-* transparentes. */
function boton_real() {
	const Btn = BtnSave()
	return { ...Btn, components: { CheckoutCaptcha: captcha_listo, 'b-button': { render(h) { return h('button', this.$slots.default) } }, 'b-spinner': pasa_contenido },
		methods: { ...Btn.methods, check() { return true } } }
}

/** Elige el método y espera a que el componente cargue lo que tenga que cargar (montos, Brick). */
async function montar_opcion_de_pago(ctx, metodo) {
	ctx.store.commit('cart/setPaymentMethod', metodo)
	const opcion = ctx.montar(CardPaymentMethod(), { payment_method: metodo })
	await esperar()
	return opcion
}

// ---------------------------------------------------------------------------------------------------------------
// CA21 — selector de cuotas con los valores del servidor
// ---------------------------------------------------------------------------------------------------------------

test('CA21 muestra solo el valor de cada cuota que calculó el servidor, sin «Total financiado»', async t => {
	const ctx = entorno(t)
	const opcion = await montar_opcion_de_pago(ctx, TARJETA)

	// Pidió los montos al servidor con el carrito y el método (el servidor es la única fuente de los números).
	const pedidos = ctx.posts_a('mercado-pago/tarjeta/montos')
	assert.ok(pedidos.length >= 1, 'no pidió POST /mercado-pago/tarjeta/montos. Requests: ' + JSON.stringify(ctx.requests.map(r => r.metodo + ' ' + r.url)))
	assert.equal(pedidos[0].body.cart_id, CART_ID)
	assert.equal(pedidos[0].body.payment_method_id, TARJETA.id)
	assert.ok(ctx.guardados.cantidad >= 1, 'tiene que guardar el carrito antes de pedir los montos')

	const visto = texto(opcion)
	assert.match(visto, /1 pago de \$115\.000,00/)
	assert.match(visto, /3 cuotas de \$42\.166,67/)
	assert.match(visto, /6 cuotas de \$23\.000,00/)
	// Regla 6 del pedido: sólo el valor de la cuota, nunca el total financiado.
	assert.doesNotMatch(visto, /total financiado/i)
	assert.doesNotMatch(visto, /126\.500/)
	assert.doesNotMatch(visto, /138\.000/)
})

test('CA21 el formulario seguro de Mercado Pago se arma con la public key del método y sin selector de cuotas propio', async t => {
	const ctx = entorno(t)
	const opcion = await montar_opcion_de_pago(ctx, TARJETA)

	assert.equal(ctx.brick.instancias.length >= 1, true, 'no creó window.MercadoPago(...)')
	assert.equal(ctx.brick.instancias[0].public_key, PUBLIC_KEY)
	assert.equal(ctx.brick.creados.length >= 1, true, 'no creó el Card Payment Brick')
	const creado = ctx.brick.creados[0]
	assert.equal(creado.tipo, 'cardPayment')
	// El Brick se dibuja dentro de un contenedor que existe en lo que ve el comprador.
	assert.equal(typeof creado.id, 'string')
	const ids = []
	;(function recorrer(v) {
		if (!v) return
		if (v.componentInstance) return recorrer(v.componentInstance._vnode)
		if (v.data && v.data.attrs && v.data.attrs.id) ids.push(v.data.attrs.id)
		;(v.children || []).forEach(recorrer)
	})(opcion._vnode)
	assert.ok(ids.includes(creado.id), 'el contenedor #' + creado.id + ' no está en el template. ids: ' + ids.join(','))
	// Las cuotas las define nuestro selector: el Brick no ofrece las suyas ni su propio botón.
	const config = creado.settings
	assert.equal(config.initialization.amount, 115000, 'arranca con 1 pago')
	assert.equal(config.customization.paymentMethods.maxInstallments, 1)
	assert.equal(config.customization.visual.hidePaymentButton, true)
})

test('CA21 el botón dice qué se va a pagar: «Pagar $X» con 1 pago y «Pagar N cuotas de $X» al elegir cuotas', async t => {
	const ctx = entorno(t)
	const opcion = await montar_opcion_de_pago(ctx, TARJETA)
	const boton = ctx.montar(boton_real())
	await esperar()
	assert.match(texto(boton), /Pagar \$115\.000,00/)
	assert.doesNotMatch(texto(boton), /Te llevamos a Mercado Pago/, 'el cobro es en la página: no redirige')
	tocar(opcion, '3 cuotas de $42.166,67')
	await esperar()
	assert.match(texto(boton), /Pagar 3 cuotas de \$42\.166,67/)
})

// ---------------------------------------------------------------------------------------------------------------
// CA21 — el pago: token, cuotas y monto; nunca datos de tarjeta
// ---------------------------------------------------------------------------------------------------------------

for (const forma_brick of ['plano', 'envuelto']) {
	// El Brick real entrega los datos del formulario; las dos formas posibles (planos o dentro de `formData`) se aceptan.
	test('CA21 paga con el token del Brick, las cuotas y el monto elegidos, y 201 lleva a Thanks (getFormData ' + forma_brick + ')', async t => {
		const ctx = entorno(t, { forma_brick })
		const opcion = await montar_opcion_de_pago(ctx, TARJETA)
		const boton = ctx.montar(boton_real())
		await esperar()
		tocar(opcion, '3 cuotas de $42.166,67')
		await esperar()

		boton.componente.confirmar()
		await esperar()

		const pagos = ctx.posts_a('mercado-pago/tarjeta/pagar')
		assert.equal(pagos.length, 1, 'tiene que hacer exactamente un POST /mercado-pago/tarjeta/pagar')
		const cuerpo = pagos[0].body
		// Lo elegido por el comprador y lo que le mostramos: cuotas y monto de la opción del servidor.
		assert.equal(cuerpo.cuotas, 3)
		assert.equal(Number(cuerpo.monto_esperado), 126500)
		assert.equal(cuerpo.payment_method_id, TARJETA.id)
		assert.equal(cuerpo.cart_id, CART_ID)
		// Los mismos datos de siempre del pedido (es el mismo cuerpo que /orders más lo del cobro).
		assert.ok('commerce_id' in cuerpo && 'buyer' in cuerpo, 'falta el cuerpo común del pedido: ' + Object.keys(cuerpo).join(','))
		// El Brick tokenizó la tarjeta: viaja el token y los datos que Mercado Pago pide, nada más.
		assert.equal(cuerpo.tarjeta.token, 'tok_1')
		assert.equal(cuerpo.tarjeta.payment_method_id, 'visa')
		assert.equal(String(cuerpo.tarjeta.issuer_id), '310')
		assert.equal(cuerpo.tarjeta.payer.email, 'comprador@example.test')
		assert.deepEqual(cuerpo.tarjeta.payer.identification, { type: 'DNI', number: '30123456' })
		// Regla PCI: ningún dato de tarjeta pasa por nuestro servidor, y el monto lo decide el servidor.
		const serializado = JSON.stringify(cuerpo)
		assert.doesNotMatch(serializado, /card_?number|security_?code|cvv|cvc|expiration|cardholder|numero_tarjeta|\d{13,19}/i)
		assert.ok(!('transaction_amount' in cuerpo) && !('transaction_amount' in cuerpo.tarjeta), 'no manda un transaction_amount propio')
		assert.equal(ctx.brick.llamadas_a_form_data, 1)
		// No se crea el pedido por el camino sin cobro.
		assert.equal(ctx.posts_a('orders').length, 0, 'con tarjeta no se llama a POST /orders')
		// 201 → pantalla de gracias, como siempre.
		assert.deepEqual(ctx.pushes, [{ name: 'Thanks' }])
	})
}

test('CA21 con 1 pago manda cuotas 1 y el monto de la opción de 1 pago', async t => {
	const ctx = entorno(t)
	await montar_opcion_de_pago(ctx, TARJETA)
	const boton = ctx.montar(boton_real())
	await esperar()
	boton.componente.confirmar()
	await esperar()
	const pagos = ctx.posts_a('mercado-pago/tarjeta/pagar')
	assert.equal(pagos.length, 1, 'tiene que hacer un POST /mercado-pago/tarjeta/pagar. Requests: ' + JSON.stringify(ctx.requests.map(r => r.metodo + ' ' + r.url)))
	const cuerpo = pagos[0].body
	assert.equal(cuerpo.cuotas, 1)
	assert.equal(Number(cuerpo.monto_esperado), 115000)
	assert.equal(cuerpo.tarjeta.token, 'tok_1')
})

// ---------------------------------------------------------------------------------------------------------------
// CA21 — errores del cobro
// ---------------------------------------------------------------------------------------------------------------

const MENSAJE_RECHAZO = 'Tu tarjeta no tiene fondos suficientes. Probá con otra tarjeta o elegí otro medio de pago.'

test('CA21 un rechazo muestra el mensaje del servidor, no cambia de ruta, libera el botón, renueva el CAPTCHA y deja reintentar', async t => {
	const ctx = entorno(t)
	const opcion = await montar_opcion_de_pago(ctx, TARJETA)
	const boton = ctx.montar(boton_real())
	await esperar()
	tocar(opcion, '3 cuotas de $42.166,67')
	await esperar()
	const revision_antes = ctx.store.state.cart.captcha_revision
	ctx.respuestas.pagar.push(() => ({ status: 422, data: { codigo: 'pago_rechazado', message: MENSAJE_RECHAZO } }))

	boton.componente.confirmar()
	await esperar()

	assert.ok(ctx.toasts.includes(MENSAJE_RECHAZO), 'el toast tiene que ser el mensaje del servidor. Toasts: ' + JSON.stringify(ctx.toasts))
	assert.deepEqual(ctx.pushes, [], 'un rechazo no cambia de ruta')
	assert.equal(boton.componente.procesando, false, 'el botón queda libre')
	assert.ok(ctx.store.state.cart.captcha_revision > revision_antes, 'el CAPTCHA se renueva')
	assert.equal(ctx.store.state.cart.cuotas_bloqueadas, false, 'el selector de cuotas se descongela')
	assert.equal(ctx.brick.desmontados, 0, 'el formulario de la tarjeta queda para reintentar')

	// Reintento con otra tarjeta (el Brick entrega otro token): se paga y queda un solo pedido.
	boton.componente.confirmar()
	await esperar()
	const pagos = ctx.posts_a('mercado-pago/tarjeta/pagar')
	assert.equal(pagos.length, 2)
	assert.equal(pagos[1].body.tarjeta.token, 'tok_2')
	assert.equal(pagos[1].body.cuotas, 3)
	assert.equal(Number(pagos[1].body.monto_esperado), 126500)
	assert.deepEqual(ctx.pushes, [{ name: 'Thanks' }])
})

test('CA21 los mensajes propios de cobro (en proceso, interés, sin respuesta, pedido no creado) se muestran tal cual, y otros errores no', async t => {
	const casos = [
		['pago_no_confirmado', 'No pudimos confirmar el pago al instante y lo cancelamos; no se te cobró. Probá de nuevo o con otra tarjeta.'],
		['cuotas_con_interes', 'Esta tarjeta no tiene 3 cuotas sin interés en este comercio. Elegí 1 pago u otra cantidad de cuotas.'],
		['pago_sin_respuesta', 'No pudimos confirmar el pago con Mercado Pago. Volvé a tocar Pagar: si ya se había cobrado, no se cobra dos veces.'],
		['pedido_no_creado', 'No pudimos registrar tu pedido y devolvimos el pago. Probá de nuevo en unos minutos.'],
	]
	for (const [codigo, message] of casos) {
		await t.test(codigo, async st => {
			const ctx = entorno(st)
			await montar_opcion_de_pago(ctx, TARJETA)
			const boton = ctx.montar(boton_real())
			await esperar()
			ctx.respuestas.pagar.push(() => ({ status: codigo === 'pago_sin_respuesta' ? 503 : 422, data: { codigo, message } }))
			boton.componente.confirmar()
			await esperar()
			assert.ok(ctx.toasts.includes(message), codigo + ': el toast tiene que ser el mensaje del servidor. Toasts: ' + JSON.stringify(ctx.toasts))
			assert.deepEqual(ctx.pushes, [])
			assert.equal(boton.componente.procesando, false)
		})
	}
	// Cualquier otro error de la API NO se muestra crudo (criterio que ya tiene la tienda).
	const ctx = entorno(t)
	await montar_opcion_de_pago(ctx, TARJETA)
	const boton = ctx.montar(boton_real())
	await esperar()
	ctx.respuestas.pagar.push(() => ({ status: 500, data: { message: 'SQLSTATE[HY000] detalle técnico interno' } }))
	boton.componente.confirmar()
	await esperar()
	assert.ok(!ctx.toasts.some(m => m.includes('SQLSTATE')), 'no puede mostrar mensajes técnicos de la API. Toasts: ' + JSON.stringify(ctx.toasts))
	assert.ok(ctx.toasts.length >= 1, 'tiene que avisar algo al comprador')
	assert.deepEqual(ctx.pushes, [])
})

test('CA21 si el total cambió (409 monto_cambio) refresca las opciones y avisa antes de volver a cobrar', async t => {
	const ctx = entorno(t)
	const opcion = await montar_opcion_de_pago(ctx, TARJETA)
	const boton = ctx.montar(boton_real())
	await esperar()
	tocar(opcion, '3 cuotas de $42.166,67')
	await esperar()
	// El servidor ahora tiene otros números (por ejemplo cambió el envío o el precio).
	const nuevas = [{ cuotas: 1, valor_cuota: 120000, total: 120000 }, { cuotas: 3, valor_cuota: 44000, total: 132000 }, { cuotas: 6, valor_cuota: 24000, total: 144000 }]
	ctx.respuestas.montos = () => ({ status: 200, data: { opciones: nuevas } })
	ctx.respuestas.pagar.push(() => ({ status: 409, data: { codigo: 'monto_cambio', opciones: nuevas } }))

	boton.componente.confirmar()
	await esperar()

	assert.ok(ctx.toasts.some(m => /El total cambió/.test(m)), 'tiene que avisar que el total cambió. Toasts: ' + JSON.stringify(ctx.toasts))
	assert.equal(ctx.posts_a('mercado-pago/tarjeta/pagar').length, 1, 'no reintenta solo: el comprador tiene que revisar')
	assert.deepEqual(ctx.pushes, [])
	assert.equal(boton.componente.procesando, false)
	const visto = texto(opcion)
	assert.match(visto, /3 cuotas de \$44\.000,00/)
	assert.doesNotMatch(visto, /42\.166,67/)
})

test('CA21 con una API vieja (404 en montos) avisa que no está disponible y no deja pagar con tarjeta', async t => {
	const ctx = entorno(t)
	ctx.respuestas.montos = () => ({ status: 404, data: { message: 'Not Found' } })
	const opcion = await montar_opcion_de_pago(ctx, TARJETA)
	const boton = ctx.montar(boton_real())
	await esperar()
	const MENSAJE = 'El pago con tarjeta no está disponible en este momento. Elegí otro medio de pago.'
	assert.ok(texto(opcion).includes(MENSAJE) || ctx.toasts.includes(MENSAJE),
		'tiene que avisarlo. Se ve: «' + texto(opcion) + '». Toasts: ' + JSON.stringify(ctx.toasts))

	boton.componente.confirmar()
	await esperar()
	assert.equal(ctx.posts_a('mercado-pago/tarjeta/pagar').length, 0, 'sin montos del servidor no se cobra')
	assert.equal(ctx.posts_a('orders').length, 0, 'y tampoco se crea un pedido sin cobrar')
	assert.deepEqual(ctx.pushes, [])
})

test('CA21 al salir del checkout el formulario de la tarjeta se desmonta (no quedan iframes colgados)', async t => {
	const ctx = entorno(t)
	const opcion = await montar_opcion_de_pago(ctx, TARJETA)
	assert.equal(ctx.brick.desmontados, 0)
	opcion.$destroy()
	await esperar()
	assert.ok(ctx.brick.desmontados >= 1, 'no llamó a controller.unmount() del Brick')
})

// ---------------------------------------------------------------------------------------------------------------
// Control: lo que NO cambia. Estos pasan hoy y tienen que seguir pasando (validan que el entorno de prueba es fiel).
// ---------------------------------------------------------------------------------------------------------------

test('CONTROL con Transferencia el pedido sigue yendo a POST /orders y a Thanks (regla 9: los otros métodos no cambian)', async t => {
	const ctx = entorno(t, { elegido: TRANSFERENCIA })
	const boton = ctx.montar(boton_real())
	await esperar()
	assert.match(texto(boton), /Finalizar compra/)
	boton.componente.confirmar()
	await esperar()
	assert.equal(ctx.posts_a('orders').length, 1)
	assert.equal(ctx.posts_a('mercado-pago/tarjeta/pagar').length, 0)
	assert.equal(ctx.posts_a('mercado-pago/tarjeta/montos').length, 0)
	assert.equal(ctx.brick.creados.length, 0, 'sin tarjeta elegida no se arma ningún Brick')
	assert.deepEqual(ctx.pushes, [{ name: 'Thanks' }])
})

// ---------------------------------------------------------------------------------------------------------------
// CA22 — Bloque B: el total del checkout lleva el recargo de la tienda
// ---------------------------------------------------------------------------------------------------------------

test('CA22 con recargo de tienda 5 % y Transferencia 10 %: Subtotal $105.000, descuento -$10.500, envío +$10.000, Total $104.500', async t => {
	const ctx = entorno(t, { elegido: TRANSFERENCIA })
	const total = ctx.montar(Total())
	await esperar()
	const visto = texto(total)
	assert.match(visto, /Subtotal \([^)]*\) \$105\.000,00/, 'el Subtotal tiene que llevar el recargo de la tienda. Se ve: ' + visto)
	assert.match(visto, /Descuento por Transferencia \(10%\) - \$10\.500,00/, visto)
	assert.match(visto, /Envío \(Zona propia\) \+ \$10\.000,00/, visto)
	assert.match(visto, /Total \$104\.500,00/, 'con transferencia el total tiene que ser 104.500 (lo que cobra el servidor). Se ve: ' + visto)
})

test('CA22 con la tarjeta en 1 pago el total es $115.000 y con 3 cuotas la línea de total dice «3 cuotas de $42.166,67»', async t => {
	const ctx = entorno(t)
	const opcion = await montar_opcion_de_pago(ctx, TARJETA)
	const total = ctx.montar(Total())
	await esperar()
	let visto = texto(total)
	assert.match(visto, /Subtotal \([^)]*\) \$105\.000,00/, visto)
	assert.match(visto, /Total \$115\.000,00/, 'con 1 pago: precio web 105.000 + envío 10.000. Se ve: ' + visto)

	tocar(opcion, '3 cuotas de $42.166,67')
	await esperar()
	visto = texto(total)
	assert.match(visto, /3 cuotas de \$42\.166,67/, 'la línea de total muestra la opción del servidor. Se ve: ' + visto)
	assert.doesNotMatch(visto, /Total \$115\.000,00/)
})

test('CA22 el selector de cuotas de Mercado Pago (Checkout Pro) parte del precio web: 3 cuotas de $42.166,67', async t => {
	const ctx = entorno(t)
	const opcion = await montar_opcion_de_pago(ctx, MERCADO_PAGO)
	const visto = texto(opcion)
	// Base: 100.000 + 5 % de la tienda + 10.000 de envío = 115.000; con el 10 % de las 3 cuotas = 126.500 / 3.
	assert.match(visto, /3 cuotas de \$42\.166,67/, 'la base de las cuotas tiene que llevar el recargo de la tienda. Se ve: ' + visto)
})

test('CONTROL sin recargo de tienda el Subtotal y los totales salen como hoy', async t => {
	const ctx = entorno(t, { elegido: TRANSFERENCIA, recargo_tienda: 0 })
	const total = ctx.montar(Total())
	await esperar()
	const visto = texto(total)
	assert.match(visto, /Subtotal \([^)]*\) \$100\.000,00/, visto)
	assert.match(visto, /Descuento por Transferencia \(10%\) - \$10\.000,00/, visto)
	assert.match(visto, /Total \$100\.000,00/, visto)
})
