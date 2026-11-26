/*
 * Misión truvari-carrito-entrega-pago, parte A (CA14-CA17): envío gratis por monto y por combo en una forma de
 * envío propia (`delivery_zones`), del lado de tienda-spa.
 *
 * La regla es una sola y está espejada en tienda-api (PHP): la tabla de casos de CA3 está copiada LITERAL abajo
 * (CASOS_CA3) para que las dos puntas no diverjan. Lo que se prueba acá es el espejo JS, el mixin del carrito con
 * Vuex real, los renders de FormasDeEnvio.vue y Total.vue (template compilado, sin DOM) y la página de gracias
 * con el mensaje de WhatsApp. Nada de red ni de navegador.
 *
 * Patrón de carga: babel + commonjs sobre los .js/.vue reales de src/ (igual que `checkout-session.test.cjs`).
 */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const babel = require('@babel/core')
const compiler = require('vue-template-compiler')
const Vue = require('vue')
const Vuex = require('vuex')
Vue.use(Vuex)
Vue.config.productionTip = false
Vue.config.devtools = false

const raiz = path.resolve(__dirname, '..')
const cache = new Map()
/**
 * Carga un módulo (o el script de un .vue) de src/ transformado con babel a commonjs.
 * @param {string} archivo ruta absoluta
 * @returns {object} exports
 */
function local(archivo) {
	// Sin extensión: .js y, si no existe, .vue (los imports de componentes no llevan extensión).
	if (!path.extname(archivo)) archivo += fs.existsSync(archivo + '.js') ? '.js' : '.vue'
	if (cache.has(archivo)) return cache.get(archivo).exports
	let fuente = fs.readFileSync(archivo, 'utf8')
	if (archivo.endsWith('.vue')) fuente = compiler.parseComponent(fuente).script.content
	const codigo = babel.transformSync(fuente, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code
	const modulo = { exports: {} }
	cache.set(archivo, modulo)
	const resolver = nombre => nombre === '@/utils/tracking' ? { trackear() {}, enviar_cola() {}, TIPOS_EVENTO: {} }
		: nombre === '@/mixins/payment_set_height' ? { default: {} }
		: nombre === '@/runtime_config' ? { env: () => '' }
		: nombre.startsWith('@/') ? local(path.resolve(raiz, 'src', nombre.slice(2)))
		: nombre.startsWith('.') ? local(path.resolve(path.dirname(archivo), nombre))
		: require(nombre)
	new Function('require', 'module', 'exports', codigo)(resolver, modulo, modulo.exports)
	return modulo.exports
}
const load = nombre => local(path.resolve(raiz, 'src', nombre))

/**
 * El helper nuevo (src/helpers/envio_zona_propia.js). Se carga perezoso para que, mientras no exista, cada
 * test falle por SU motivo (falta el helper) y no todo el archivo por un require roto.
 * @returns {object}
 */
function helper() {
	const ruta = path.join(raiz, 'src/helpers/envio_zona_propia.js')
	assert.ok(fs.existsSync(ruta), 'falta src/helpers/envio_zona_propia.js (helper de la regla de envío gratis)')
	return load('helpers/envio_zona_propia')
}

// Formateador de precio de prueba: recibe SIEMPRE un número y devuelve "$ 80.000".
const fmt = n => {
	assert.equal(typeof n, 'number', 'el formateador recibe un número, no un string')
	assert.ok(Number.isFinite(n))
	return '$ ' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// Forma propia de referencia (PLAN §7): $7.000, gratis desde $80.000 y con combos.
const zona = (extra = {}) => ({ id: 1, name: 'Envío Truvari', description: '', price: 7000, costo_a_convenir: 0, envio_gratis_desde: 80000, envio_gratis_con_combo: 1, ...extra })
const zona_vieja = () => ({ id: 1, name: 'Envío Truvari', description: '', price: '7000.00', costo_a_convenir: 0 })

/*
 * CA3 copiada LITERAL (tienda-api tests/Unit/EnvioZonaPropiaHelperTest.php::test_tabla_de_casos_de_la_regla).
 * [nombre, zona, subtotal, tiene_combo, {precio, gratis, motivo, a_convenir}]
 */
const CASOS_CA3 = [
	['(90000, sin combo) -> gratis por monto', zona(), 90000, false, { precio: 0, gratis: true, motivo: 'monto', a_convenir: false }],
	['(80000 justos) -> gratis por monto (>=)', zona(), 80000, false, { precio: 0, gratis: true, motivo: 'monto', a_convenir: false }],
	['(79999.99) -> cobra 7000', zona(), 79999.99, false, { precio: 7000, gratis: false, motivo: null, a_convenir: false }],
	['(35000, con combo) -> gratis por combo', zona(), 35000, true, { precio: 0, gratis: true, motivo: 'combo', a_convenir: false }],
	['(35000, con combo, casilla 0) -> cobra 7000', zona({ envio_gratis_con_combo: 0 }), 35000, true, { precio: 7000, gratis: false, motivo: null, a_convenir: false }],
	['(90000, desde null, casilla 0) -> cobra 7000', zona({ envio_gratis_desde: null, envio_gratis_con_combo: 0 }), 90000, false, { precio: 7000, gratis: false, motivo: null, a_convenir: false }],
	['(90000, con combo) -> el motivo es monto', zona(), 90000, true, { precio: 0, gratis: true, motivo: 'monto', a_convenir: false }],
	['a convenir con 90000 -> a_convenir, precio 0, no gratis', zona({ costo_a_convenir: 1 }), 90000, false, { precio: 0, gratis: false, motivo: null, a_convenir: true }],
	['zona sin las claves -> 7000', zona_vieja(), 90000, true, { precio: 7000, gratis: false, motivo: null, a_convenir: false }],
	['desde "80000.00" y casilla "1" (strings) con 90000 -> monto', zona({ price: '7000.00', envio_gratis_desde: '80000.00', envio_gratis_con_combo: '1' }), 90000, false, { precio: 0, gratis: true, motivo: 'monto', a_convenir: false }],
	['desde "80000.00" y casilla "1" (strings) con 79999.99 -> 7000', zona({ price: '7000.00', envio_gratis_desde: '80000.00', envio_gratis_con_combo: '1' }), 79999.99, false, { precio: 7000, gratis: false, motivo: null, a_convenir: false }],
	['desde "80000.00" y casilla "1" (strings) con combo y 35000 -> combo', zona({ price: '7000.00', envio_gratis_desde: '80000.00', envio_gratis_con_combo: '1' }), 35000, true, { precio: 0, gratis: true, motivo: 'combo', a_convenir: false }],
]

test('CA14 resolver_zona da los mismos resultados que la tabla de CA3, caso por caso', () => {
	const { resolver_zona } = helper()
	for (const [nombre, z, subtotal, combo, esperado] of CASOS_CA3) {
		assert.deepEqual(resolver_zona(z, subtotal, combo), esperado, nombre)
	}
})

test('CA14 el subtotal también puede llegar como string decimal (carts.total viene así de la API)', () => {
	const { resolver_zona } = helper()
	assert.deepEqual(resolver_zona(zona(), '90000.00', false), { precio: 0, gratis: true, motivo: 'monto', a_convenir: false })
	assert.deepEqual(resolver_zona(zona(), '79999.99', false), { precio: 7000, gratis: false, motivo: null, a_convenir: false })
})

test('CA14 desde 0, negativo o no numérico nunca da gratis por monto', () => {
	const { resolver_zona } = helper()
	for (const desde of [0, '0', '0.00', -5, 'abc', '', null]) {
		assert.equal(resolver_zona(zona({ envio_gratis_desde: desde, envio_gratis_con_combo: 0 }), 999999, false).gratis, false, 'desde=' + JSON.stringify(desde))
	}
})

test('CA15 carrito_tiene_combo: promoción de vinoteca o combo con cantidad > 0; artículos sueltos no cuentan', () => {
	const { carrito_tiene_combo } = helper()
	assert.equal(carrito_tiene_combo({ articles: [{ id: 1, pivot: { amount: 2, price: 10 } }], promociones_vinoteca: [], combos: [] }), false)
	assert.equal(carrito_tiene_combo({ articles: [], promociones_vinoteca: [{ id: 3, pivot: { amount: 1, price: 15000 } }] }), true)
	assert.equal(carrito_tiene_combo({ articles: [], combos: [{ id: 4, pivot: { amount: '2', price: 100 } }] }), true)
	assert.equal(carrito_tiene_combo({ articles: [], promociones_vinoteca: [{ id: 3, pivot: { amount: 0, price: 15000 } }] }), false)
	assert.equal(carrito_tiene_combo({}), false)
	assert.equal(carrito_tiene_combo(null), false)
})

test('CA15 textos: motivo del gratis y hint de lo que falta', () => {
	const { texto_motivo_gratis, hint_envio_gratis } = helper()
	assert.equal(texto_motivo_gratis('monto', zona(), fmt), 'Por compras desde $ 80.000')
	assert.equal(texto_motivo_gratis('combo', zona(), fmt), 'Con combos')
	assert.equal(texto_motivo_gratis(null, zona(), fmt), '')
	// Falta plata y la forma también regala con combo.
	assert.equal(hint_envio_gratis(zona(), 68000, false, fmt), 'Te faltan $ 12.000 para el envío gratis o sumá un combo')
	// Sólo por monto.
	assert.equal(hint_envio_gratis(zona({ envio_gratis_con_combo: 0 }), 68000, false, fmt), 'Te faltan $ 12.000 para el envío gratis')
	// Sólo por combo.
	assert.equal(hint_envio_gratis(zona({ envio_gratis_desde: null }), 10000, false, fmt), 'Gratis si sumás un combo')
	// Sin nada que decir: ya es gratis, a convenir o forma común.
	assert.equal(hint_envio_gratis(zona(), 90000, false, fmt), '')
	assert.equal(hint_envio_gratis(zona(), 35000, true, fmt), '')
	assert.equal(hint_envio_gratis(zona({ costo_a_convenir: 1 }), 68000, false, fmt), '')
	assert.equal(hint_envio_gratis(zona_vieja(), 68000, false, fmt), '')
})

/**
 * Store real para el mixin del carrito y los renders: módulos cart/commerce/delivery_zones/auth/orders.
 * @param {object} o {zona, carrito, comercio, medio_de_pago}
 * @returns {Vuex.Store}
 */
function store_checkout({ zona: z = zona(), carrito = {}, comercio = {}, medio_de_pago = null } = {}) {
	const Cart = load('store/cart').default
	const store = new Vuex.Store({ modules: {
		cart: { ...Cart, state: JSON.parse(JSON.stringify(Cart.state)), actions: { ...Cart.actions, save() { return [] } } },
		commerce: { namespaced: true, state: { commerce: { id: 1, owner_id: 10, online_configuration: {}, ...comercio } } },
		delivery_zones: { namespaced: true, state: { models: z ? [z] : [] } },
		auth: { namespaced: true, state: { user: null, authenticated: false }, mutations: { setLoading() {}, setMessage() {}, setUser() {} } },
		orders: { namespaced: true, state: { order: null } },
	} })
	store.commit('cart/setCart', { id: 20, articles: [], promociones_vinoteca: [], combos: [], deliver: 1, ...carrito })
	if (z) store.commit('cart/setDeliveryZone', z)
	if (medio_de_pago) store.commit('cart/setPaymentMethod', medio_de_pago)
	return store
}

const dates = load('mixins/dates').default
const cart_mixin = load('mixins/cart').default
// Pedazos de las mixins globales de main.js que los componentes del checkout usan.
const globales = { methods: { setTitle() {}, flag_activo(v) { return Number(v) === 1 || v === true } }, computed: { commerce() { return this.$store.state.commerce.commerce } } }

/**
 * Instancia de Vue con el mixin real del carrito sobre el store.
 * @param {Vuex.Store} store
 * @returns {Vue}
 */
function vm_mixin(store) {
	return new Vue({ store, mixins: [dates, globales, cart_mixin], render(h) { return h('div') } })
}

test('CA15 mixin: subtotal 90000 -> envio_precio_elegido 0, total_with_deliver 90000 y motivo monto', () => {
	const vm = vm_mixin(store_checkout({ carrito: { total: '90000.00', articles: [{ id: 1, pivot: { amount: 2, price: 45000 } }] } }))
	assert.equal(vm.envio_precio_elegido, 0)
	assert.equal(vm.total_with_deliver, 90000)
	assert.equal(vm.envio_zona_resuelta.gratis, true)
	assert.equal(vm.envio_zona_resuelta.motivo, 'monto')
})

test('CA15 mixin: subtotal 68000 -> cobra 7000, total_with_deliver 75000 y el hint dice cuánto falta', () => {
	const vm = vm_mixin(store_checkout({ carrito: { total: '68000.00', articles: [{ id: 1, pivot: { amount: 1, price: 68000 } }] } }))
	assert.equal(vm.envio_precio_elegido, 7000)
	assert.equal(vm.total_with_deliver, 75000)
	assert.equal(vm.envio_zona_resuelta.gratis, false)
	const { hint_envio_gratis } = helper()
	assert.equal(hint_envio_gratis(vm.cart_delivery_zone, vm.total, false, fmt), 'Te faltan $ 12.000 para el envío gratis o sumá un combo')
})

test('CA15 mixin: con una promoción en el carrito el envío es 0 y el motivo es combo (texto "Con combos")', () => {
	const vm = vm_mixin(store_checkout({ carrito: {
		total: '35000.00', articles: [{ id: 1, pivot: { amount: 1, price: 20000 } }],
		promociones_vinoteca: [{ id: 9, pivot: { amount: 1, price: 15000 } }],
	} }))
	assert.equal(vm.envio_precio_elegido, 0)
	assert.equal(vm.total_with_deliver, 35000)
	assert.equal(vm.envio_zona_resuelta.motivo, 'combo')
	assert.equal(helper().texto_motivo_gratis(vm.envio_zona_resuelta.motivo, vm.cart_delivery_zone, fmt), 'Con combos')
})

test('CA15 mixin: un combo (no promoción) también da el envío gratis', () => {
	const vm = vm_mixin(store_checkout({ carrito: { total: '30000.00', articles: [], combos: [{ id: 4, pivot: { amount: 1, price: 30000 } }] } }))
	assert.equal(vm.envio_precio_elegido, 0)
	assert.equal(vm.envio_zona_resuelta.motivo, 'combo')
})

test('CA15 mixin: sin el total del servidor (invitado) usa la suma local y también da gratis', () => {
	const vm = vm_mixin(store_checkout({ carrito: { articles: [{ id: 1, pivot: { amount: 2, price: 45000 } }] } }))
	assert.equal(vm.total, 90000)
	assert.equal(vm.envio_precio_elegido, 0)
})

test('CA15 mixin: el mínimo se compara con el subtotal de productos, no con el total_web ni con el medio de pago', () => {
	// Recargo web 10%: 75000 -> total_web 82500 (>= 80000), pero el subtotal de la regla es 75000: cobra 7000.
	const con_recargo = vm_mixin(store_checkout({ comercio: { online_configuration: { online_price_surchage: 10 } }, carrito: { total: '75000.00' } }))
	assert.equal(Math.round(con_recargo.total_web), 82500)
	assert.equal(con_recargo.envio_precio_elegido, 7000)
	// Descuento 10% por pagar en efectivo: 85000 -> 76500 con el medio de pago, pero sigue gratis.
	const con_descuento = vm_mixin(store_checkout({ carrito: { total: '85000.00' }, medio_de_pago: { id: 10, name: 'Efectivo', discount: 10, surchage: 0 } }))
	assert.equal(con_descuento.envio_precio_elegido, 0)
	assert.equal(Math.round(con_descuento.total_with_deliver), 76500)
})

test('CA15 mixin: a convenir sigue igual que hoy (no suma, nunca gratis, aunque llegue al mínimo)', () => {
	const vm = vm_mixin(store_checkout({ zona: zona({ costo_a_convenir: 1 }), carrito: { total: '90000.00' } }))
	assert.equal(vm.zona_elegida_a_convenir, true)
	assert.equal(vm.envio_precio_elegido, 0)
	assert.equal(vm.total_with_deliver, 90000)
	assert.equal(vm.envio_zona_resuelta.a_convenir, true)
	assert.equal(vm.envio_zona_resuelta.gratis, false)
})

test('CA15 mixin: con retiro por el local (deliver 0) no hay envío', () => {
	const vm = vm_mixin(store_checkout({ carrito: { total: '50000.00', deliver: 0 } }))
	assert.equal(vm.envio_precio_elegido, 0)
	assert.equal(vm.total_with_deliver, 50000)
})

/**
 * Renderiza el template compilado de un .vue del checkout (sin DOM ni montaje) y devuelve el árbol de VNodes.
 * @param {string} archivo ruta relativa a src/
 * @param {Vuex.Store} store
 * @returns {object} vnode raíz
 */
function render_vue(archivo, store) {
	const fuente = fs.readFileSync(path.join(raiz, 'src', archivo), 'utf8')
	const sfc = compiler.parseComponent(fuente)
	const { render, staticRenderFns } = compiler.compileToFunctions(sfc.template.content)
	const componente = load(archivo).default
	const vm = new Vue({ ...componente, store, mixins: [dates, globales].concat(componente.mixins || []), render, staticRenderFns })
	return vm._render()
}

/**
 * Texto plano de un VNode (con espacios colapsados).
 * @param {object} vnode
 * @returns {string}
 */
function texto(vnode) {
	if (!vnode) return ''
	let t = vnode.text || ''
	;(vnode.children || []).forEach(h => { t += ' ' + texto(h) })
	return t.replace(/\s+/g, ' ').trim()
}

/**
 * Todos los VNodes del árbol que cumplen el predicado.
 * @param {object} vnode
 * @param {function} cumple
 * @returns {object[]}
 */
function buscar(vnode, cumple, acc = []) {
	if (!vnode) return acc
	if (cumple(vnode)) acc.push(vnode)
	;(vnode.children || []).forEach(h => buscar(h, cumple, acc))
	return acc
}
const clases = v => ((v.data && v.data.staticClass) || '') + ' ' + JSON.stringify((v.data && v.data.class) || '')

/**
 * Texto del precio de la opción de la forma propia en FormasDeEnvio.vue.
 * @param {object} arbol
 * @returns {string}
 */
function precio_en_formas(arbol) {
	const nodos = buscar(arbol, v => v.tag === 'p' && /checkout-option__price/.test(clases(v)))
	assert.equal(nodos.length, 1, 'hay un precio por forma propia')
	return texto(nodos[0])
}

test('CA15 FormasDeEnvio muestra "Gratis" (no "$ 0") con el motivo cuando corresponde', () => {
	const gratis = render_vue('components/payment/components/FormasDeEnvio.vue', store_checkout({ carrito: { total: '90000.00' } }))
	assert.equal(precio_en_formas(gratis), 'Gratis')
	assert.match(texto(gratis), /Por compras desde \$\s?80\.000/)
	assert.doesNotMatch(texto(gratis), /\$\s?0([^.,\d]|$)/)
	const combo = render_vue('components/payment/components/FormasDeEnvio.vue', store_checkout({ carrito: { total: '35000.00', promociones_vinoteca: [{ id: 9, pivot: { amount: 1, price: 15000 } }] } }))
	assert.equal(precio_en_formas(combo), 'Gratis')
	assert.match(texto(combo), /Con combos/)
})

test('CA15 FormasDeEnvio con 68000 muestra el precio y cuánto falta, sin "Gratis"', () => {
	const arbol = render_vue('components/payment/components/FormasDeEnvio.vue', store_checkout({ carrito: { total: '68000.00' } }))
	assert.match(precio_en_formas(arbol), /^\$\s?7\.000/)
	assert.match(texto(arbol), /Te faltan \$\s?12\.000(,00)? para el envío gratis o sumá un combo/)
	assert.doesNotMatch(precio_en_formas(arbol), /Gratis/)
})

test('CA15 FormasDeEnvio: a convenir sigue diciendo "A coordinar con el vendedor"', () => {
	const arbol = render_vue('components/payment/components/FormasDeEnvio.vue', store_checkout({ zona: zona({ costo_a_convenir: 1 }), carrito: { total: '90000.00' } }))
	assert.equal(precio_en_formas(arbol), 'A coordinar con el vendedor')
	assert.doesNotMatch(texto(arbol), /Gratis/)
})

/**
 * La línea "Envío (zona) ..." del resumen de Total.vue.
 * @param {object} arbol
 * @returns {object} vnode
 */
function linea_de_envio(arbol) {
	const nodos = buscar(arbol, v => v.tag === 'p' && /checkout-summary__line/.test(clases(v)) && /^Envío \(Envío Truvari\)/.test(texto(v)))
	assert.equal(nodos.length, 1, 'hay una línea de envío de la forma propia')
	return nodos[0]
}

test('CA15 Total.vue: la línea de la zona dice "Gratis" (en verde) y no "+ $ 7.000" cuando corresponde', () => {
	const arbol = render_vue('components/payment/components/payment-method/Total.vue', store_checkout({ carrito: { total: '90000.00' } }))
	const linea = linea_de_envio(arbol)
	assert.match(texto(linea), /Gratis/)
	assert.doesNotMatch(texto(linea), /\+|\$/)
	assert.match(clases(linea), /checkout-summary__line--good/)
})

test('CA15 Total.vue: con 68000 sigue "+ $7.000" sin verde, y a convenir sigue "A coordinar"', () => {
	const cobra = linea_de_envio(render_vue('components/payment/components/payment-method/Total.vue', store_checkout({ carrito: { total: '68000.00' } })))
	assert.match(texto(cobra), /\+ \$\s?7\.000/)
	assert.doesNotMatch(clases(cobra), /checkout-summary__line--good/)
	const convenir = linea_de_envio(render_vue('components/payment/components/payment-method/Total.vue', store_checkout({ zona: zona({ costo_a_convenir: 1 }), carrito: { total: '90000.00' } })))
	assert.match(texto(convenir), /A coordinar/)
	assert.doesNotMatch(texto(convenir), /Gratis/)
})

test('CA17 compatibilidad: zona sin las claves nuevas cobra price, nunca "Gratis" y sin hint', () => {
	const { resolver_zona, hint_envio_gratis } = helper()
	assert.deepEqual(resolver_zona(zona_vieja(), 500000, true), { precio: 7000, gratis: false, motivo: null, a_convenir: false })
	assert.equal(hint_envio_gratis(zona_vieja(), 68000, false, fmt), '')
	const vm = vm_mixin(store_checkout({ zona: zona_vieja(), carrito: { total: '500000.00', promociones_vinoteca: [{ id: 9, pivot: { amount: 1, price: 15000 } }] } }))
	assert.equal(vm.envio_precio_elegido, 7000)
	assert.equal(vm.total_with_deliver, 507000)
	const formas = render_vue('components/payment/components/FormasDeEnvio.vue', store_checkout({ zona: zona_vieja(), carrito: { total: '500000.00' } }))
	assert.match(precio_en_formas(formas), /^\$\s?7\.000/)
	assert.doesNotMatch(texto(formas), /Gratis|Te faltan/)
	const total = linea_de_envio(render_vue('components/payment/components/payment-method/Total.vue', store_checkout({ zona: zona_vieja(), carrito: { total: '500000.00' } })))
	assert.match(texto(total), /\+ \$\s?7\.000/)
})

test('CA17 compatibilidad: las claves en null / 0 (zona común de una base ya migrada) cobran price', () => {
	const { resolver_zona } = helper()
	assert.deepEqual(resolver_zona(zona({ envio_gratis_desde: null, envio_gratis_con_combo: 0 }), 500000, true), { precio: 7000, gratis: false, motivo: null, a_convenir: false })
})

/* ---------------------------------------------------------------- CA16: gracias y WhatsApp */

// Pedido tal como lo devuelve GET /api/orders/current: zona (CA11) + foto de lo que se cobró (snapshot).
const pedido = (extra = {}) => ({
	id: 30, num: 28, deliver: 1, address: 'Av. Siempre Viva 742', total: 90000,
	buyer: { name: 'Fernando', phone: '3515550000' },
	articles: [{ id: 1, name: 'Fernet', pivot: { amount: 2, price: 45000 } }], promociones_vinoteca: [], combos: [],
	delivery_zone_id: 1, delivery_zone: zona({ price: '7000.00', envio_gratis_desde: '80000.00', envio_gratis_con_combo: '1' }),
	envio_zona_precio: '0.00', envio_zona_gratis_motivo: 'monto', envio_opcion: null,
	...extra,
})

/**
 * Instancia real de Thanks.vue (sin su created, que arranca timers y WhatsApp) con el pedido en el store.
 * @param {object} order
 * @returns {Vue}
 */
function vm_thanks(order) {
	const thanks = load('views/Thanks.vue').default
	const whatsapp = load('mixins/whatsapp').default
	const store = new Vuex.Store({ modules: { orders: { namespaced: true, state: { order } } } })
	const con_comercio = { computed: { commerce() { return { phone: '3444622139', online_configuration: { enviar_whatsapp_al_terminar_pedido: 1 } } } }, methods: { setTitle() {}, flag_activo(v) { return Number(v) === 1 } } }
	return new Vue({ ...thanks, store, mixins: [dates, whatsapp, con_comercio], created() {}, beforeDestroy() {}, render(h) { return h('div') } })
}
const linea_zona = lineas => lineas.filter(l => /^Envío: Envío Truvari/.test(l))

test('CA16 gracias: pedido con snapshot 0/monto -> "Envío: Envío Truvari · Gratis (compras desde $ 80.000)"', () => {
	const lineas = vm_thanks(pedido()).order_extra_lines
	const zona_linea = linea_zona(lineas)
	assert.equal(zona_linea.length, 1, 'exactamente una línea de la forma propia: ' + JSON.stringify(lineas))
	assert.match(zona_linea[0], /^Envío: Envío Truvari · Gratis \(compras desde \$\s?80\.000(,00)?\)$/)
})

test('CA16 gracias: snapshot 0/combo -> "· Gratis (con combos)"', () => {
	const zona_linea = linea_zona(vm_thanks(pedido({ envio_zona_gratis_motivo: 'combo' })).order_extra_lines)
	assert.equal(zona_linea.length, 1)
	assert.equal(zona_linea[0], 'Envío: Envío Truvari · Gratis (con combos)')
})

test('CA16 gracias: snapshot 7000 -> "· $ 7.000"; sin snapshot se lee el precio vivo de la zona', () => {
	for (const extra of [{ envio_zona_precio: '7000.00', envio_zona_gratis_motivo: null }, { envio_zona_precio: null, envio_zona_gratis_motivo: null }, { envio_zona_precio: undefined, envio_zona_gratis_motivo: undefined }]) {
		const zona_linea = linea_zona(vm_thanks(pedido(extra)).order_extra_lines)
		assert.equal(zona_linea.length, 1, JSON.stringify(extra))
		assert.match(zona_linea[0], /^Envío: Envío Truvari · \$\s?7\.000(,00)?$/, JSON.stringify(extra))
	}
})

test('CA16 gracias: con envío por correo no se agrega la línea de la zona; con retiro por el local tampoco', () => {
	const correo = pedido({ envio_opcion: { carrier_name: 'Andreani', service_name: 'Domicilio' }, envio_precio: 5000 })
	assert.deepEqual(linea_zona(vm_thanks(correo).order_extra_lines), [])
	assert.deepEqual(linea_zona(vm_thanks(pedido({ deliver: 0 })).order_extra_lines), [])
})

test('CA16 helper texto_envio_del_pedido: los textos exactos del plan', () => {
	const { texto_envio_del_pedido } = helper()
	assert.equal(texto_envio_del_pedido(pedido(), fmt), 'Envío: Envío Truvari · Gratis (compras desde $ 80.000)')
	assert.equal(texto_envio_del_pedido(pedido({ envio_zona_gratis_motivo: 'combo' }), fmt), 'Envío: Envío Truvari · Gratis (con combos)')
	assert.equal(texto_envio_del_pedido(pedido({ envio_zona_precio: '7000.00', envio_zona_gratis_motivo: null }), fmt), 'Envío: Envío Truvari · $ 7.000')
	assert.equal(texto_envio_del_pedido(pedido({ envio_zona_precio: null, envio_zona_gratis_motivo: null }), fmt), 'Envío: Envío Truvari · $ 7.000')
	assert.equal(texto_envio_del_pedido(pedido({ delivery_zone: zona({ costo_a_convenir: 1 }), envio_zona_precio: null, envio_zona_gratis_motivo: null }), fmt), 'Envío: Envío Truvari · A coordinar con el vendedor')
	// Sin zona, con correo o con retiro por el local: no hay línea.
	assert.equal(texto_envio_del_pedido(pedido({ delivery_zone: null, delivery_zone_id: null }), fmt), '')
	assert.equal(texto_envio_del_pedido(pedido({ envio_opcion: { carrier_name: 'Andreani' } }), fmt), '')
	assert.equal(texto_envio_del_pedido(pedido({ deliver: 0 }), fmt), '')
})

test('CA16 WhatsApp: el mensaje incluye la línea de envío propio con deliver y sin correo', () => {
	const { mensaje_pedido_whatsapp } = load('helpers/mensaje_pedido_whatsapp')
	const formato = { precio: n => fmt(n), fecha: d => 'fecha ' + d, texto_envio: '', texto_envio_zona: 'Envío: Envío Truvari · Gratis (compras desde $ 80.000)' }
	const con_zona = mensaje_pedido_whatsapp(pedido(), formato)
	assert.ok(con_zona.includes('Envío: Envío Truvari · Gratis (compras desde $ 80.000)'), con_zona)
	// Con envío por correo la línea de la zona no va (sólo la del correo).
	const con_correo = mensaje_pedido_whatsapp(pedido({ envio_opcion: { carrier_name: 'Andreani' } }), { ...formato, texto_envio: 'Envío: Andreani · $ 5.000' })
	assert.ok(!con_correo.includes('Envío Truvari'), con_correo)
	assert.ok(con_correo.includes('Envío: Andreani · $ 5.000'))
	// Retiro por el local: tampoco.
	assert.ok(!mensaje_pedido_whatsapp(pedido({ deliver: 0 }), formato).includes('Envío Truvari'))
})

test('CA16 WhatsApp end-to-end: el enlace que arma Thanks lleva la línea gratis, y con 7000 el importe', () => {
	const decodificado = vm => decodeURIComponent(vm.whatsapp_link.split('?text=')[1])
	const gratis = vm_thanks(pedido())
	gratis.set_whatsapp_link()
	assert.match(decodificado(gratis), /Envío: Envío Truvari · Gratis \(compras desde \$\s?80\.000(,00)?\)/)
	const paga = vm_thanks(pedido({ envio_zona_precio: '7000.00', envio_zona_gratis_motivo: null }))
	paga.set_whatsapp_link()
	assert.match(decodificado(paga), /Envío: Envío Truvari · \$\s?7\.000(,00)?/)
	// Sin snapshot (pedido viejo): precio vivo, como hoy el sistema lo cobraba.
	const vieja = vm_thanks(pedido({ envio_zona_precio: null, envio_zona_gratis_motivo: null }))
	vieja.set_whatsapp_link()
	assert.match(decodificado(vieja), /Envío: Envío Truvari · \$\s?7\.000(,00)?/)
})
