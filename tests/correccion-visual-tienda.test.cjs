// Corrección visual C1: defectos D1, D2 y D6 de la corrida visual local (VISUAL-LOCAL-20261120).
// Las guardas de CSS no prueban el layout (eso se mide en navegador): sólo evitan que se pierda la regla.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const babel = require('@babel/core')
const compiler = require('vue-template-compiler')
const Vue = require('vue')
const Vuex = require('vuex')
Vue.use(Vuex)

const raiz = path.resolve(__dirname, '..')
const leer = ruta => fs.readFileSync(path.join(raiz, ruta), 'utf8')
const estilos = ruta => compiler.parseComponent(leer(ruta)).styles.map(s => s.content).join('\n')

// Devuelve las líneas hijas (más indentadas) de la primera línea de un bloque Sass indentado que coincide con `selector`.
function bloque_sass(fuente, selector) {
	const lineas = fuente.split('\n')
	const inicio = lineas.findIndex(linea => linea.trim() === selector)
	assert.notEqual(inicio, -1, 'no existe el bloque ' + selector)
	const sangria = linea => linea.match(/^\t*/)[0].length
	const base = sangria(lineas[inicio])
	const hijas = []
	for (let i = inicio + 1; i < lineas.length; i++) {
		if (lineas[i].trim() !== '' && sangria(lineas[i]) <= base) break
		hijas.push(lineas[i])
	}
	return hijas.join('\n')
}

// Devuelve el interior de un bloque SCSS `selector {` (primera llave que abre hasta su cierre).
function bloque_scss(fuente, selector) {
	const inicio = fuente.indexOf('\n\t' + selector + ' {')
	assert.notEqual(inicio, -1, 'no existe el bloque ' + selector)
	const abre = fuente.indexOf('{', inicio)
	let profundidad = 0
	for (let i = abre; i < fuente.length; i++) {
		if (fuente[i] === '{') profundidad++
		if (fuente[i] === '}' && --profundidad === 0) return fuente.slice(abre + 1, i)
	}
	assert.fail('bloque sin cerrar ' + selector)
}

// D1: las reglas globales `.tarjetas-*-N a { width: N% }` alcanzan a TODO <a> de la tienda (App.vue); el banner con
// enlace (U8) pasó de div a <a> y quedó al 18 % del ancho. El estilo propio tiene que fijar el ancho.
test('el banner enlazado fija su ancho contra las reglas globales de <a>', () => {
	const bloque = bloque_sass(estilos('src/components/home/components/TitleJumbotron.vue'), 'a.title-image')
	assert.match(bloque, /^\t*width: 100%$/m)
	assert.match(bloque, /^\t*max-width: 100%$/m)
})

// D2: el título del pie no cortaba palabras largas y `&__link` (un <a>) heredaba el ancho de tarjeta de las reglas globales.
test('título y enlaces del pie parten palabras largas y no heredan el ancho de tarjeta', () => {
	const estilo = estilos('src/components/common/footer/Index.vue')
	assert.match(bloque_scss(estilo, '&__title'), /overflow-wrap: anywhere;/)
	const enlace = bloque_scss(estilo, '&__link')
	assert.match(enlace, /width: auto;/)
	assert.match(enlace, /max-width: 100%;/)
	assert.match(enlace, /overflow-wrap: anywhere;/)
})

// D6: «Reintentar verificación» medía 154×31 px (size="sm" y sin estilo propio): no se podía tocar con el dedo.
test('Reintentar verificación tiene objetivo táctil de 44 px', () => {
	const sfc = compiler.parseComponent(leer('src/components/payment/components/CheckoutCaptcha.vue'))
	const codigo = babel.transformSync(sfc.script.content, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code
	const modulo = { exports: {} }
	const resolver = nombre => nombre === '@/store/cart' ? { contexto_captcha: () => 'ctx', limpiar_token_captcha() {}, recibir_token_captcha() {} } : require(nombre)
	new Function('require', 'module', 'exports', codigo)(resolver, modulo, modulo.exports)
	const compilado = compiler.compileToFunctions(sfc.template.content)
	const store = new Vuex.Store({ modules: { cart: { state: { captcha_revision: 0 } } } })
	// Sustituto de BootstrapVue: lo que importa es qué props, clase y eventos recibe el botón.
	const components = { 'b-button': { props: ['size', 'variant'], render: h => h('button') } }
	const vm = new Vue({ ...modulo.exports.default, components, render: compilado.render, staticRenderFns: compilado.staticRenderFns, store })
	vm.error = true
	const boton = vm._render().children.find(hijo => hijo.componentOptions && /b-button/.test(hijo.tag))
	assert.ok(boton, 'con error=true debe renderizar el botón de reintento')
	assert.match((boton.data && boton.data.staticClass) || '', /checkout-captcha__reintentar/)
	assert.notEqual(boton.componentOptions.propsData.size, 'sm')
	assert.equal(boton.componentOptions.listeners.click, vm.reintentar)
	assert.match(boton.componentOptions.children.map(n => n.text).join('').trim(), /^Reintentar verificación$/)
	assert.match(bloque_sass(sfc.styles.map(s => s.content).join('\n'), '.checkout-captcha__reintentar'), /^\t*min-height: 44px$/m)
	vm.$destroy()
})
