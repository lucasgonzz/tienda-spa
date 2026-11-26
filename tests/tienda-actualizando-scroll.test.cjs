// CA23 (retoque de interfaz): mientras la pantalla "Estamos actualizando la tienda" está montada, el
// documento no debe scrollear (la pantalla tapa todo pero la barra y la rueda seguían moviendo la
// página de atrás). Al desmontarse se restaura el overflow anterior de <html> y <body>.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const babel = require('@babel/core')
const compiler = require('vue-template-compiler')
const Vue = require('vue')
const Vuex = require('vuex')
Vue.use(Vuex)

// Transpila el <script> del componente real a CommonJS.
function cargar_componente() {
	const archivo = path.resolve(__dirname, '..', 'src', 'components', 'common', 'TiendaActualizando.vue')
	const fuente = compiler.parseComponent(fs.readFileSync(archivo, 'utf8')).script.content
	const codigo = babel.transformSync(fuente, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code
	const modulo = { exports: {} }
	const resolver = nombre => (nombre === '@/utils/tienda_actualizando' ? { iniciar_reintento() { return () => {} } } : require(nombre))
	new Function('require', 'module', 'exports', codigo)(resolver, modulo, modulo.exports)
	return modulo.exports.default
}
const store = () => new Vuex.Store({ modules: { commerce: { namespaced: true, state: { actualizando: true }, actions: { getCommerce() {} } } } })

test('bloquea el scroll del documento mientras está montada y restaura el valor anterior al destruirse', t => {
	global.document = { documentElement: { style: { overflow: 'scroll' } }, body: { style: { overflow: '' } } }
	t.after(() => { delete global.document })
	const Componente = cargar_componente()
	const vm = new Vue({ ...Componente, store: store() })
	assert.equal(document.documentElement.style.overflow, 'hidden')
	assert.equal(document.body.style.overflow, 'hidden')
	vm.$destroy()
	assert.equal(document.documentElement.style.overflow, 'scroll', 'restaura el valor que tenía <html>')
	assert.equal(document.body.style.overflow, '', 'restaura el valor que tenía <body>')
})

test('una segunda pantalla montada y destruida no pisa el overflow original', t => {
	global.document = { documentElement: { style: { overflow: '' } }, body: { style: { overflow: 'auto' } } }
	t.after(() => { delete global.document })
	const Componente = cargar_componente()
	const vm_1 = new Vue({ ...Componente, store: store() })
	vm_1.$destroy()
	const vm_2 = new Vue({ ...Componente, store: store() })
	vm_2.$destroy()
	assert.equal(document.documentElement.style.overflow, '')
	assert.equal(document.body.style.overflow, 'auto')
})
