// CA23 (ronda 2, mision aviso-actualizacion-sistema): al liberarse la tienda la página TIENE que
// recargarse, aunque el componente se destruya en el mismo flush de Vue.
//
// El defecto que fija: getCommerce hace commit('set_actualizando', false) y App.vue dibuja
// <tienda-actualizando v-if="actualizando">; el flush de Vue destruye el componente (beforeDestroy
// corta el reintento) ANTES de que siga la cadena .then que decide recargar. Resultado: no había
// window.location.reload() y el comprador que entró durante la actualización quedaba sin catálogo.
// Acá un padre con un watcher sobre `actualizando` emula el v-if de App.vue (crea y destruye el hijo).
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test, mock } = require('node:test')
const babel = require('@babel/core')
const compiler = require('vue-template-compiler')
const Vue = require('vue')
const Vuex = require('vuex')
Vue.use(Vuex)

const tick = () => new Promise(r => setImmediate(r))
const src = (...partes) => path.resolve(__dirname, '..', 'src', ...partes)

// Transpila un archivo de src/ (o el <script> de un .vue) a CommonJS y resuelve '@/' contra src/.
const cache = new Map()
function cargar(archivo) {
	if (!path.extname(archivo)) archivo += '.js'
	if (cache.has(archivo)) return cache.get(archivo).exports
	let fuente = fs.readFileSync(archivo, 'utf8')
	if (archivo.endsWith('.vue')) fuente = compiler.parseComponent(fuente).script.content
	const codigo = babel.transformSync(fuente, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code
	const modulo = { exports: {} }
	cache.set(archivo, modulo)
	const resolver = nombre => (nombre.startsWith('@/') ? cargar(src(nombre.slice(2))) : nombre.startsWith('.') ? cargar(path.resolve(path.dirname(archivo), nombre)) : require(nombre))
	new Function('require', 'module', 'exports', codigo)(resolver, modulo, modulo.exports)
	return modulo.exports
}

// Store real con la mutación y una acción getCommerce que, como la de verdad, apaga `actualizando`
// cuando el comercio llega (cuando `liberado()` da true).
function armar({ liberado }) {
	const Componente = cargar(src('components', 'common', 'TiendaActualizando.vue')).default
	const estado = { pedidos: 0, creados: 0, destruidos: 0 }
	const store = new Vuex.Store({ modules: { commerce: { namespaced: true, state: { actualizando: true, commerce: null },
		mutations: { set_actualizando(s, v) { s.actualizando = v } },
		actions: { getCommerce({ commit }) { estado.pedidos++; if (liberado()) commit('set_actualizando', false); return Promise.resolve() } } } } })
	// Padre que emula App.vue: el hijo existe sólo mientras `actualizando` es true.
	const padre = new Vue({
		store,
		data: () => ({ hijo: null }),
		computed: { actualizando() { return this.$store.state.commerce.actualizando } },
		watch: { actualizando: { immediate: true, handler(valor) {
			if (valor && !this.hijo) {
				this.hijo = new Vue({ ...Componente, store, created() { estado.creados++; Componente.created.call(this) }, beforeDestroy() { estado.destruidos++; Componente.beforeDestroy.call(this) } })
			} else if (!valor && this.hijo) {
				this.hijo.$destroy()
				this.hijo = null
			}
		} } },
	})
	return { padre, estado, store }
}

test('al liberarse recarga exactamente una vez aunque el v-if destruya la pantalla en el mismo flush', async t => {
	mock.timers.enable({ apis: ['setInterval'] })
	let recargas = 0
	global.window = { location: { reload() { recargas++ } } }
	t.after(() => { mock.timers.reset(); delete global.window })
	let liberado = false
	const { padre, estado } = armar({ liberado: () => liberado })
	assert.equal(estado.creados, 1)
	mock.timers.tick(30000)
	await tick()
	assert.equal(estado.pedidos, 1)
	assert.equal(recargas, 0, 'sigue actualizando: no recarga')
	liberado = true
	mock.timers.tick(30000)
	await tick()
	await tick()
	assert.equal(estado.destruidos, 1, 'el v-if sí destruyó la pantalla al bajar actualizando')
	assert.equal(recargas, 1, 'tiene que recargar una vez, aunque ya no exista el componente')
	mock.timers.tick(120000)
	await tick()
	assert.equal(estado.pedidos, 2, 'ya liberada no vuelve a consultar')
	assert.equal(recargas, 1, 'no recarga dos veces')
	padre.$destroy()
})

test('si la pantalla se destruye por otro motivo antes de que el reintento consulte, no recarga ni consulta', async t => {
	mock.timers.enable({ apis: ['setInterval'] })
	let recargas = 0
	global.window = { location: { reload() { recargas++ } } }
	t.after(() => { mock.timers.reset(); delete global.window })
	const { padre, estado, store } = armar({ liberado: () => true })
	store.commit('commerce/set_actualizando', false)
	await tick()
	assert.equal(estado.destruidos, 1)
	mock.timers.tick(120000)
	await tick()
	assert.equal(estado.pedidos, 0, 'destruida antes de consultar: el reintento quedó cortado')
	assert.equal(recargas, 0)
	padre.$destroy()
})
