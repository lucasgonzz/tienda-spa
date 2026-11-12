const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { test } = require('node:test')
const babel = require('@babel/core')
const compiler = require('vue-template-compiler')
const Vue = require('vue')
const Vuex = require('vuex')

Vue.use(Vuex)
Vue.config.productionTip = false
// No se monta DOM: el render produce VNodes reales. Estos listeners solo
// permiten ejecutar el cierre normal del componente al terminar cada caso.
global.document = { addEventListener() {}, removeEventListener() {} }

const raiz = path.resolve(__dirname, '..')
const cache = new Map()
const componentes = [
	'src/components/article/components/data/buy-box/Cantidad.vue',
	'src/components/article/components/data/buy-box/Index.vue',
	'src/views/Article.vue',
	'src/store/articles/articles.js',
]

// Se ejecutan los componentes, templates y mutaciones reales. Solo se aísla el envío
// de tracking para que estas pruebas no importen el store global ni hagan red.
function cargar(nombre) {
	if (nombre === '@/utils/tracking') {
		return { trackear() {}, abrir_vista_de_producto() {}, cerrar_vista() {}, TIPOS_EVENTO: {} }
	}
	if (nombre.startsWith('@/components/')
		&& !nombre.includes('/buy-box/')
		&& !nombre.includes('/add-to-cart/Index')) {
		// La vista usa estos bloques visuales, pero no participan en su inicialización.
		return { default: {} }
	}
	if (!nombre.startsWith('@/') && !path.isAbsolute(nombre)) {
		return require(nombre)
	}
	let archivo = nombre.startsWith('@/') ? path.join(raiz, 'src', nombre.slice(2)) : nombre
	if (!path.extname(archivo)) {
		archivo += fs.existsSync(archivo + '.js') ? '.js' : '.vue'
	}
	if (cache.has(archivo)) {
		return cache.get(archivo).exports
	}
	let fuente = fs.readFileSync(archivo, 'utf8')
	const relativo = path.relative(raiz, archivo).split(path.sep).join('/')
	// Permite demostrar la regresión contra la revisión anterior, sin cambiar el checkout.
	if (process.env.CC_TEST_BASE_REF && componentes.includes(relativo)) {
		fuente = execFileSync('git', ['show', process.env.CC_TEST_BASE_REF + ':' + relativo], { cwd: raiz, encoding: 'utf8' })
	}
	const descriptor = archivo.endsWith('.vue') ? compiler.parseComponent(fuente) : null
	const script = descriptor ? descriptor.script.content : fuente
	const transformado = babel.transformSync(script, {
		babelrc: false,
		configFile: false,
		plugins: ['@babel/plugin-transform-modules-commonjs'],
	}).code
	const modulo = { exports: {} }
	cache.set(archivo, modulo)
	new Function('require', 'module', 'exports', transformado)(cargar, modulo, modulo.exports)
	if (descriptor && descriptor.template) {
		const compilado = compiler.compileToFunctions(descriptor.template.content)
		Object.assign(modulo.exports.default, compilado)
	}
	return modulo.exports
}

const Cantidad = cargar('@/components/article/components/data/buy-box/Cantidad').default
const Caja = cargar('@/components/article/components/data/buy-box/Index').default
const moduloArticulos = cargar('@/store/articles/articles').default
const moduloCarrito = cargar('@/store/cart').default
const VistaArticulo = cargar('@/views/Article.vue').default
const axios = require('axios')
Vue.prototype.$scrollToTop = () => {}

function ficha({ stock = 10, variantes = [], variante = null, consultar = false, ignorar = false, cantidad = '' } = {}) {
	const store = new Vuex.Store({
		modules: {
			articles: {
				...moduloArticulos,
				state: { ...moduloArticulos.state, amount: cantidad, selected_article_variant: variante },
			},
		},
	})
	const comercio = { consultas_de_stock: consultar, online_configuration: { ignorar_stock: ignorar, mostrar_stock_disponible: true } }
	const vm = new Vue({
		extends: Cantidad,
		store,
		propsData: { article: { id: 1577, stock, article_variants: variantes, online: 1, status: 'active' } },
		computed: { commerce() { return comercio } },
	})
	vm.$toast = { error() {} }
	return { vm, store }
}

function texto(vnode) {
	return (vnode.text || '') + (vnode.children || []).map(texto).join('')
}

test('la ficha con stock renderiza Cantidad sin una dependencia de stock faltante', () => {
	const { vm, store } = ficha()
	const errores = []
	const anterior = Vue.config.errorHandler
	Vue.config.errorHandler = error => errores.push(error.message)
	try {
		const nodo = vm._render()
		assert.deepEqual(errores, [])
		assert.equal(nodo.tag, 'div')
		assert.match(texto(nodo), /Cantidad:/)
		assert.match(texto(nodo), /1 unidad/)
		assert.equal(vm.max, 10)
		assert.equal(store.state.articles.amount, 1)
	} finally {
		Vue.config.errorHandler = anterior
		vm.$destroy()
	}
})

test('el selector forma parte del mismo módulo que habilita los botones de compra', () => {
	assert.equal(Caja.components.Cantidad, Cantidad)
	assert.equal(typeof Caja.components.Cantidad, 'object')
})

test('permite elegir dos y aplicar diez; rechaza excedente, fracción y valores inválidos', () => {
	const { vm, store } = ficha()
	assert.deepEqual(vm.opciones, [1, 2, 3, 4, 5, 6])
	vm.elegir(2)
	assert.equal(store.state.articles.amount, 2)
	vm.cantidad_manual = '10'
	assert.equal(vm.cantidad_manual_valida, true)
	vm.aplicar_manual()
	assert.equal(store.state.articles.amount, 10)
	for (const valor of ['11', '0', '-1', '1.5', 'abc', '']) {
		vm.cantidad_manual = valor
		assert.equal(vm.cantidad_manual_valida, false, valor)
		vm.aplicar_manual()
		assert.equal(store.state.articles.amount, 10)
	}
	vm.$destroy()
})

test('una unidad disponible conserva el selector y acota opciones y entrada manual', () => {
	const { vm } = ficha({ stock: 1 })
	assert.deepEqual(vm.opciones, [1])
	assert.equal(vm.texto_disponibles, '(1 disponible)')
	vm.cantidad_manual = '2'
	assert.equal(vm.cantidad_manual_valida, false)
	vm.$destroy()
})

test('la variante elegida limita la cantidad y el cero sigue siendo un límite', async () => {
	const variantes = [{ id: 1, stock: 2 }, { id: 2, stock: 0 }]
	const { vm, store } = ficha({ variantes, variante: variantes[0], cantidad: 5 })
	assert.equal(vm.max, 2)
	vm.recortar_al_stock()
	assert.equal(store.state.articles.amount, 2)
	store.commit('articles/setSelectedArticleVariant', variantes[1])
	await Vue.nextTick()
	assert.equal(vm.max, 0)
	assert.deepEqual(vm.opciones, [])
	vm.cantidad_manual = '1'
	assert.equal(vm.cantidad_manual_valida, false)
	vm.$destroy()
})

test('Consultar e ignorar stock permiten cantidades; un agotado normal no las ofrece', () => {
	for (const opciones of [{ stock: 0, consultar: true }, { stock: 0, ignorar: true }, { stock: null }]) {
		const { vm } = ficha(opciones)
		assert.equal(vm.max, null)
		assert.deepEqual(vm.opciones, [1, 2, 3, 4, 5, 6])
		vm.cantidad_manual = '12'
		assert.equal(vm.cantidad_manual_valida, true)
		vm.$destroy()
	}
	const { vm } = ficha({ stock: 0 })
	assert.equal(vm.max, 0)
	assert.deepEqual(vm.opciones, [])
	vm.$destroy()
})

test('Consultar respeta la variante seleccionada y no toma el stock total del artículo', () => {
	const variantes = [{ id: 1, stock: 0 }, { id: 2, stock: 3 }]
	const consulta = ficha({ variantes, variante: variantes[0], consultar: true })
	assert.equal(consulta.vm.max, null)
	consulta.vm.$destroy()
	const disponible = ficha({ variantes, variante: variantes[1], consultar: true })
	assert.equal(disponible.vm.max, 3)
	disponible.vm.cantidad_manual = '4'
	assert.equal(disponible.vm.cantidad_manual_valida, false)
	disponible.vm.$destroy()
})

test('el cero numérico o textual de una variante queda agotado, o Consultar si está habilitado', async () => {
	for (const stock of [0, '0']) {
		const variante = { id: 1, stock }
		const agotado = ficha({ variantes: [variante], variante, cantidad: 2 })
		assert.equal(agotado.vm.max, 0)
		assert.equal(agotado.vm.hasStock(agotado.vm.article), false)
		agotado.vm.recortar_al_stock()
		await Vue.nextTick()
		await Vue.nextTick()
		assert.deepEqual(agotado.vm.opciones, [])
		agotado.vm.$destroy()
		const consulta = ficha({ variantes: [variante], variante, consultar: true })
		assert.equal(consulta.vm.stock_a_consultar_en_ficha(consulta.vm.article), true)
		assert.equal(consulta.vm.max, null)
		consulta.vm.$destroy()
	}
})

function fichaConCarrito({ carritoInicial = null, promo = null } = {}) {
	const articulo = { id: 1577, stock: 10, images: [], article_variants: [], article_properties: [], online: 1, status: 'active' }
	const store = new Vuex.Store({
		modules: {
			articles: {
				...moduloArticulos,
				state: { ...moduloArticulos.state, article_to_show: articulo, amount: '', notes: '', selected_article_variant: null },
				actions: {
					getSimilars() {}, get_tambien_compraron_vistas() {}, get_tambien_compraron_compras() {},
				},
			},
			cart: { ...moduloCarrito, state: JSON.parse(JSON.stringify(moduloCarrito.state)) },
			client_offers: {
				namespaced: true,
				state: { cantidad_pendiente: promo },
				mutations: { set_cantidad_pendiente(state, valor) { state.cantidad_pendiente = valor } },
			},
		},
	})
	if (carritoInicial) store.commit('cart/setCart', carritoInicial)
	const comercio = { consultas_de_stock: false, online_configuration: { ignorar_stock: false } }
	const vista = new Vue({ extends: VistaArticulo, store })
	const selector = new Vue({ extends: Cantidad, store, propsData: { article: articulo }, computed: { commerce() { return comercio } } })
	selector.$toast = { error() {} }
	function respuestaCarrito(carrito) {
		// Ejecuta la action getLastCart y la mutación setCart reales con el transporte
		// controlado. La carga de artículo y la de carrito pueden terminar en cualquier orden.
		let resolver
		const anterior = axios.get
		axios.get = () => new Promise(resolve => { resolver = resolve })
		const carga = store.dispatch('cart/getLastCart')
		axios.get = anterior
		return { carga, terminar() { resolver({ data: { has_last_cart: !!carrito, last_cart: carrito } }) } }
	}
	return { store, vista, selector, respuestaCarrito, cerrar() { vista.$destroy(); selector.$destroy() } }
}

function carritoConCantidad(cantidad) {
	return { id: 27, articles: [{ id: 1577, pivot: { amount: cantidad, price: 100, notes: '' } }], promociones_vinoteca: [], combos: [] }
}

test('restaura tres al llegar tarde el carrito y no vuelve a pisar la ficha en guardados posteriores', async () => {
	const caso = fichaConCarrito()
	const pedido = caso.respuestaCarrito(carritoConCantidad(3))
	assert.equal(caso.store.state.articles.amount, 1)
	pedido.terminar()
	await pedido.carga
	await Vue.nextTick()
	assert.equal(caso.store.state.articles.amount, 3)
	assert.equal(caso.selector.texto_unidades, '3 unidades')
	caso.store.commit('cart/setCart', carritoConCantidad(5))
	assert.equal(caso.store.state.articles.amount, 3)
	const siguiente = caso.respuestaCarrito(carritoConCantidad(6))
	siguiente.terminar()
	await siguiente.carga
	assert.equal(caso.store.state.articles.amount, 3)
	caso.cerrar()
})

test('si el carrito llegó primero, la ficha conserva su cantidad desde el arranque', () => {
	const caso = fichaConCarrito({ carritoInicial: carritoConCantidad(3) })
	assert.equal(caso.store.state.articles.amount, 3)
	assert.equal(caso.selector.texto_unidades, '3 unidades')
	caso.cerrar()
})

test('la elección de una o dos unidades durante la carga gana al carrito tardío', async () => {
	for (const cantidad of [1, 2]) {
		const caso = fichaConCarrito()
		const pedido = caso.respuestaCarrito(carritoConCantidad(3))
		caso.selector.elegir(cantidad)
		pedido.terminar()
		await pedido.carga
		assert.equal(caso.store.state.articles.amount, cantidad)
		caso.cerrar()
	}
})

test('una promoción pendiente, una variante elegida o notas editadas no son pisadas por la carga', async () => {
	for (const tipo of ['promo', 'variante', 'notas', 'promo-misma-ficha']) {
		const caso = fichaConCarrito({ promo: tipo === 'promo' ? 6 : null })
		const pedido = caso.respuestaCarrito(carritoConCantidad(3))
		if (tipo === 'variante') caso.store.commit('articles/setSelectedArticleVariant', { id: 4, stock: 5 })
		if (tipo === 'notas') caso.store.commit('articles/setNotes', 'Entregar por la tarde')
		if (tipo === 'promo-misma-ficha') {
			caso.store.commit('articles/setArticleToShow', { ...caso.store.state.articles.article_to_show })
			caso.store.commit('articles/setAmount', 1)
		}
		pedido.terminar()
		await pedido.carga
		assert.equal(caso.store.state.articles.amount, tipo === 'promo' ? 6 : 1, tipo)
		if (tipo === 'variante') assert.equal(caso.store.state.articles.selected_article_variant.id, 4)
		if (tipo === 'notas') assert.equal(caso.store.state.articles.notes, 'Entregar por la tarde')
		caso.cerrar()
	}
})

test('la respuesta sin carrito consume la restauración y el cierre libera la suscripción', async () => {
	const caso = fichaConCarrito()
	const pedido = caso.respuestaCarrito(null)
	pedido.terminar()
	await pedido.carga
	assert.equal(caso.vista.restauracion_carrito_pendiente, false)
	const siguiente = caso.respuestaCarrito(carritoConCantidad(3))
	siguiente.terminar()
	await siguiente.carga
	assert.equal(caso.store.state.articles.amount, 1)
	const suscriptores = caso.store._actionSubscribers.length
	caso.cerrar()
	assert.equal(caso.store._actionSubscribers.length, suscriptores - 1)
})
