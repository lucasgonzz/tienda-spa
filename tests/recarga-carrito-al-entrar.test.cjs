// CA28 (ronda 2): toCart() debe recargar el carrito (cart/getLastCart) tambien al ENTRAR
// a la vista del carrito desde otra ruta, para que el comprador vea el ajuste de stock.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const babel = require('@babel/core')

// Se carga el mixin real nav.js; sus dependencias de libreria y el mixin app se reemplazan por stubs.
function cargar_nav() {
	const archivo = path.resolve(__dirname, '..', 'src', 'mixins', 'nav.js')
	const codigo = babel.transformSync(fs.readFileSync(archivo, 'utf8'), { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code
	const modulo = { exports: {} }
	const requerir = nombre => (nombre === 'vue-screen-size' ? { VueScreenSizeMixin: {} } : { default: {} })
	new Function('require', 'module', 'exports', codigo)(requerir, modulo, modulo.exports)
	return modulo.exports.default
}
const toCart = cargar_nav().methods.toCart

// Contexto falso: registra dispatch, push y toasts.
function contexto({ ruta, register_to_buy = 1, pago_pendiente = false, items = 2 }) {
	const registro = { dispatch: [], push: [], toasts: [] }
	const ctx = {
		$route: { name: ruta },
		commerce: { online_configuration: { register_to_buy } },
		flag_activo: v => v == 1 || v === true,
		checkCartPaymentStatus: () => pago_pendiente,
		cant_cart_items: items,
		$store: { dispatch: nombre => registro.dispatch.push(nombre) },
		$router: { push: destino => registro.push.push(destino) },
		$scrollToTop() {},
		$toast: { warning: m => registro.toasts.push(m) },
	}
	return { ctx, registro }
}

test('entrar al carrito desde otra ruta recarga el carrito y navega', () => {
	const { ctx, registro } = contexto({ ruta: 'Home' })
	toCart.call(ctx)
	assert.deepEqual(registro.dispatch, ['cart/getLastCart'])
	assert.deepEqual(registro.push, [{ name: 'Cart' }])
})

test('sin register_to_buy no recarga pero igual navega', () => {
	const { ctx, registro } = contexto({ ruta: 'Home', register_to_buy: 0 })
	toCart.call(ctx)
	assert.deepEqual(registro.dispatch, [])
	assert.deepEqual(registro.push, [{ name: 'Cart' }])
})

test('con pago pendiente o carrito vacio no navega ni recarga', () => {
	const a = contexto({ ruta: 'Home', pago_pendiente: true })
	toCart.call(a.ctx)
	assert.deepEqual(a.registro.push, [])
	const b = contexto({ ruta: 'Home', items: 0 })
	toCart.call(b.ctx)
	assert.deepEqual(b.registro.push, [])
	assert.deepEqual(b.registro.toasts, ['Tu carrito esta vacio'])
})

test('estando en el carrito sigue recargando sin navegar', () => {
	const { ctx, registro } = contexto({ ruta: 'Cart' })
	toCart.call(ctx)
	assert.deepEqual(registro.dispatch, ['cart/getLastCart'])
	assert.deepEqual(registro.push, [])
})
