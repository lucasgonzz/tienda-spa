/*
 * Misión tienda-cobro-tarjeta, CA23: la leyenda «Con Transferencia o Efectivo, 10 % de descuento».
 *
 * Qué fija:
 *  - La función pura `leyenda_descuento(metodos, mostrar)` de `src/utils/leyenda_descuento.js`: arma el texto sola
 *    con los nombres de los métodos de pago que tienen el MAYOR descuento (nada hardcodeado para un cliente).
 *  - El componente real `components/common/LeyendaDescuento.vue` (prop `variante`: tarjeta | ficha | sitio): lee
 *    los métodos del store y la casilla `mostrar_leyenda_de_descuento` de la configuración online, y no dibuja
 *    nada si la casilla está apagada, si no hay descuento o si los precios están ocultos.
 *  - Que la leyenda se monta en los tres lugares del plan (tarjeta del listado, ficha y franja del sitio).
 *
 * Los componentes se montan de verdad (Vue 2 + Vuex reales, template compilado) con un parche mínimo de DOM,
 * el mismo criterio de checkout-captcha.test.cjs. No acredita la mirada en el navegador (CA24, la hace el Coordinador).
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
Vue.config.warnHandler = () => {}

const raiz = path.resolve(__dirname, '..')
const cache = new Map()

/** Carga un módulo de src/ (js o .vue con su template compilado) con babel, sin webpack. */
function cargar(nombre, desde) {
	if (nombre === '@/utils/tracking') return { trackear() {}, enviar_cola() {}, TIPOS_EVENTO: {} }
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

const metodo = (name, discount, extra = {}) => ({ id: Math.floor(Math.random() * 1e6), name, discount, surchage: null, type: { name: 'Otro' }, ...extra })

// ---------------------------------------------------------------------------------------------------------------
// Función pura
// ---------------------------------------------------------------------------------------------------------------

test('CA23 función pura: nombres de los métodos con el MAYOR descuento y el porcentaje', () => {
	const { leyenda_descuento } = src('utils/leyenda_descuento')
	assert.equal(typeof leyenda_descuento, 'function')
	assert.equal(
		leyenda_descuento([metodo('Transferencia', '10.00'), metodo('Efectivo', '10.00'), metodo('Mercado Pago', '0.00')], true),
		'Con Transferencia o Efectivo, 10 % de descuento')
	// Si uno tiene más descuento que otro, sólo figura el mayor.
	assert.equal(
		leyenda_descuento([metodo('Transferencia', 10), metodo('Efectivo', 5)], true),
		'Con Transferencia, 10 % de descuento')
	// Tres con el mismo porcentaje: «A, B o C».
	assert.equal(
		leyenda_descuento([metodo('Transferencia', 10), metodo('Efectivo', 10), metodo('Depósito', 10)], true),
		'Con Transferencia, Efectivo o Depósito, 10 % de descuento')
	// Los nombres van como los escribió el comercio.
	assert.equal(
		leyenda_descuento([metodo('Transferencia bancaria (CBU)', 15)], true),
		'Con Transferencia bancaria (CBU), 15 % de descuento')
})

test('CA23 función pura: el porcentaje va sin ceros de más y con coma decimal', () => {
	const { leyenda_descuento } = src('utils/leyenda_descuento')
	assert.equal(leyenda_descuento([metodo('Transferencia', '4.76')], true), 'Con Transferencia, 4,76 % de descuento')
	assert.equal(leyenda_descuento([metodo('Transferencia', '10.50')], true), 'Con Transferencia, 10,5 % de descuento')
	assert.equal(leyenda_descuento([metodo('Transferencia', '10.00')], true), 'Con Transferencia, 10 % de descuento')
})

test('CA23 función pura: casilla apagada, sin descuento o datos raros dan texto vacío', () => {
	const { leyenda_descuento } = src('utils/leyenda_descuento')
	const con_descuento = [metodo('Transferencia', 10)]
	for (const apagada of [false, undefined, null, 0]) {
		assert.equal(leyenda_descuento(con_descuento, apagada), '', 'mostrar=' + String(apagada))
	}
	// La columna viaja como 1/0 desde la API: 1 prende.
	assert.equal(leyenda_descuento(con_descuento, 1), 'Con Transferencia, 10 % de descuento')
	// Ningún método con descuento (o sólo recargos): nada.
	assert.equal(leyenda_descuento([metodo('Mercado Pago', '0.00'), metodo('Tarjeta', null, { surchage: '5.00' })], true), '')
	assert.equal(leyenda_descuento([], true), '')
	assert.equal(leyenda_descuento(undefined, true), '')
	assert.equal(leyenda_descuento(null, true), '')
	// Un descuento negativo no es un descuento.
	assert.equal(leyenda_descuento([metodo('Raro', -5)], true), '')
})

// ---------------------------------------------------------------------------------------------------------------
// Componente real, montado con Vue/Vuex reales
// ---------------------------------------------------------------------------------------------------------------

/**
 * Parche mínimo de DOM: Vue mantiene componentes, hooks y reactividad reales; el elemento es un doble.
 * Es el mismo criterio de checkout-captcha.test.cjs.
 */
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

/** Store mínimo con lo que lee la leyenda: métodos de pago y configuración online del comercio. */
function armar_store({ metodos, flag, register_to_buy = 0, autenticado = false }) {
	return new Vuex.Store({ modules: {
		payment_methods: { namespaced: true, state: { models: metodos, loading: false } },
		commerce: { state: { commerce: { id: 1, online_configuration: {
			mostrar_leyenda_de_descuento: flag,
			register_to_buy,
			online_price_type: { slug: 'only_registered' },
		} }, workdays: [] } },
		auth: { namespaced: true, state: { authenticated: autenticado, user: null } },
		articles: { namespaced: true, state: { articles: [] } },
	} })
}

/**
 * Monta el componente real de la leyenda con la variante pedida, lee su texto visible y lo desmonta.
 * Todo en la misma llamada para que varios montajes seguidos en un mismo test no se pisen los globales.
 */
function leyenda_montada(variante, datos) {
	const previo = Vue.prototype.__patch__
	const ventana_previa = global.window
	Vue.prototype.__patch__ = parche
	// El mixin global de generals.js lee window.innerWidth y escucha 'resize' al crear cada componente.
	global.window = { innerWidth: 1280, addEventListener() {}, removeEventListener() {} }
	try {
		const Leyenda = src('components/common/LeyendaDescuento.vue').default
		const vm = new Vue({ store: armar_store(datos), render: h => h(Leyenda, { props: { variante } }) })
		vm.$mount()
		const visto = texto(vm)
		vm.$destroy()
		return visto
	} finally {
		Vue.prototype.__patch__ = previo
		if (ventana_previa === undefined) delete global.window; else global.window = ventana_previa
	}
}

const METODOS = [metodo('Transferencia', '10.00'), metodo('Efectivo', '10.00'), metodo('Mercado Pago', '0.00')]

test('CA23 componente: dibuja la leyenda armada con los métodos del store, en las tres variantes', () => {
	for (const variante of ['tarjeta', 'ficha', 'sitio']) {
		assert.equal(
			leyenda_montada(variante, { metodos: METODOS, flag: 1 }),
			'Con Transferencia o Efectivo, 10 % de descuento', variante)
	}
})

test('CA23 componente: casilla apagada, ausente o sin descuento no dibuja nada', () => {
	for (const flag of [0, false, undefined, null]) {
		assert.equal(leyenda_montada('tarjeta', { metodos: METODOS, flag }), '', 'flag=' + String(flag))
	}
	assert.equal(leyenda_montada('ficha', { metodos: [metodo('Mercado Pago', '0.00')], flag: 1 }), '')
	assert.equal(leyenda_montada('sitio', { metodos: [], flag: 1 }), '')
})

test('CA23 componente: donde los precios están ocultos no se ve la leyenda', () => {
	// Comercio que exige registro para ver precios y un visitante sin sesión: puede_ver_precios() es false.
	assert.equal(leyenda_montada('tarjeta', { metodos: METODOS, flag: 1, register_to_buy: 1, autenticado: false }), '')
	assert.equal(leyenda_montada('sitio', { metodos: METODOS, flag: 1, register_to_buy: 1, autenticado: false }), '')
})

// ---------------------------------------------------------------------------------------------------------------
// Dónde se monta
// ---------------------------------------------------------------------------------------------------------------

/** Busca en el AST del template todos los elementos con ese tag. */
function elementos_con_tag(ast, tag, acumulado = []) {
	if (!ast) return acumulado
	if (ast.tag === tag) acumulado.push(ast)
	;(ast.children || []).forEach(h => elementos_con_tag(h, tag, acumulado))
	;((ast.ifConditions || []).slice(1)).forEach(c => elementos_con_tag(c.block, tag, acumulado))
	return acumulado
}

test('CA23 la leyenda está montada en la tarjeta del listado, en la ficha y en la franja del sitio', () => {
	const lugares = [
		['components/common/article-card/body/Price.vue', 'tarjeta'],
		['components/article/components/data/Index.vue', 'ficha'],
		['components/nav/Index.vue', 'sitio'],
	]
	lugares.forEach(function(lugar) {
		const fuente = fs.readFileSync(path.join(raiz, 'src', lugar[0]), 'utf8')
		const sfc = compiler.parseComponent(fuente)
		const ast = compiler.compile(sfc.template.content, { preserveWhitespace: false }).ast
		const usos = elementos_con_tag(ast, 'leyenda-descuento')
		assert.ok(usos.length >= 1, lugar[0] + ' no monta <leyenda-descuento>')
		assert.ok(usos.some(u => u.attrsMap.variante === lugar[1]), lugar[0] + ' tiene que usar variante="' + lugar[1] + '"')
		assert.match(sfc.script.content, /LeyendaDescuento/, lugar[0] + ' no registra el componente')
	})
})
