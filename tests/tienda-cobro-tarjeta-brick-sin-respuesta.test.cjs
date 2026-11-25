/*
 * Misión tienda-cobro-tarjeta: el Brick que nunca responde. Con una public key inválida (o Mercado Pago caído) el SDK
 * carga pero ni `onReady`, ni `onError`, ni la promesa de `create` avisan. Tiene que haber un tiempo de espera
 * (15 s) que pase al estado de error con el aviso y deje elegir otro medio de pago. Se usa un reloj falso (node:test).
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
		if (r.status === 0) return Promise.reject({ message: 'Network Error' })
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
	const brick = { onsubmit: [], instancias: [], creados: [], desmontados: 0, llamadas_a_form_data: 0, tokens: ['tok_1', 'tok_2', 'tok_3', 'tok_4'] }
	function MercadoPagoFalso(public_key, opciones) {
		brick.instancias.push({ public_key, opciones })
		this.bricks = function() {
			return {
				create(tipo, id, settings) {
					brick.creados.push({ tipo, id, settings })
					if (cfg.sdk_tira) throw new Error('SDK roto')
					const controlador = {
						getFormData() {
							brick.llamadas_a_form_data++
							const datos = { token: brick.tokens.shift(), issuer_id: '310', payment_method_id: 'visa', transaction_amount: 1, installments: 1,
								payer: { ...(cfg.brick_sin_email ? {} : { email: 'comprador@example.test' }), identification: { type: 'DNI', number: '30123456' } } }
							return Promise.resolve(forma_brick === 'envuelto' ? { formData: datos } : datos)
						},
						unmount() { brick.desmontados++ },
					}
					if (cfg.brick_colgado) return new Promise(function() {})
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
	Vue.prototype.$toast = { error(m) { toasts.push(String(m)) }, warning(m) { toasts.push(String(m)) }, success(m) { toasts.push(String(m)) } }
	Vue.prototype.$router = { push(destino) { pushes.push(destino); return Promise.resolve() } }
	global.MercadoPago = MercadoPagoFalso
	// El mixin global de generals.js lee window.innerWidth y escucha 'resize' al crear cada componente.
	global.window = { MercadoPago: MercadoPagoFalso, __CC_CONFIG__: {}, innerWidth: 1280, addEventListener() {}, removeEventListener() {} }

	// Store: el módulo cart es el real (con su estado propio); sólo se simula el guardado del carrito.
	const store = new Vuex.Store({ modules: {
		cart: { ...Cart.default, state: JSON.parse(JSON.stringify(Cart.default.state)),
			actions: { ...Cart.default.actions, save() { guardados.cantidad++; return [] } } },
		commerce: { state: { commerce: { id: 1, owner_id: 10, name: 'Masquito', consultas_de_stock: !!cfg.consultas, online_configuration: { online_price_surchage: recargo_tienda, register_to_buy: 0 } }, workdays: [] },
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


const AVISO = /No pudimos cargar el formulario de la tarjeta/
const CARGANDO = /Cargando formulario seguro/

test('BRICK-1 si el Brick no responde en 15 s pasa al aviso de error en vez de quedar cargando', async t => {
	t.mock.timers.enable({ apis: ['setTimeout'] })
	const ctx = entorno(t, { brick_colgado: true })
	const opcion = await montar_opcion_de_pago(ctx, TARJETA)
	assert.match(texto(opcion), CARGANDO)
	t.mock.timers.tick(14999)
	await esperar()
	assert.match(texto(opcion), CARGANDO, 'antes de los 15 s sigue esperando')
	assert.doesNotMatch(texto(opcion), AVISO)
	t.mock.timers.tick(1)
	await esperar()
	assert.match(texto(opcion), AVISO)
	assert.doesNotMatch(texto(opcion), CARGANDO)
})

test('BRICK-2 si onReady llega a tiempo no hay aviso aunque pase el plazo', async t => {
	t.mock.timers.enable({ apis: ['setTimeout'] })
	const ctx = entorno(t, { brick_colgado: true })
	const opcion = await montar_opcion_de_pago(ctx, TARJETA)
	ctx.brick.creados[0].settings.callbacks.onReady()
	await esperar()
	t.mock.timers.tick(60000)
	await esperar()
	assert.doesNotMatch(texto(opcion), AVISO)
	assert.doesNotMatch(texto(opcion), CARGANDO)
})

test('BRICK-3 si onReady llega después del plazo no rompe nada y el formulario se recupera', async t => {
	t.mock.timers.enable({ apis: ['setTimeout'] })
	const ctx = entorno(t, { brick_colgado: true })
	const opcion = await montar_opcion_de_pago(ctx, TARJETA)
	t.mock.timers.tick(15000)
	await esperar()
	assert.match(texto(opcion), AVISO)
	assert.doesNotThrow(() => ctx.brick.creados[0].settings.callbacks.onReady())
	await esperar()
	assert.doesNotMatch(texto(opcion), AVISO)
})

test('BRICK-4 onError corta la espera y al destruir el formulario no queda ningún timer pendiente', async t => {
	t.mock.timers.enable({ apis: ['setTimeout'] })
	const ctx = entorno(t, { brick_colgado: true })
	const opcion = await montar_opcion_de_pago(ctx, TARJETA)
	ctx.brick.creados[0].settings.callbacks.onError()
	await esperar()
	assert.match(texto(opcion), AVISO)
	// Otro formulario que se destruye antes del plazo: el timer no puede disparar sobre un componente muerto.
	const otro = entorno(t, { brick_colgado: true })
	const opcion_2 = await montar_opcion_de_pago(otro, TARJETA)
	opcion_2.$destroy()
	assert.doesNotThrow(() => t.mock.timers.tick(60000))
})
