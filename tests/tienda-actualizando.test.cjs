// CA23 (mision aviso-actualizacion-sistema): cuando tienda-api responde la marca de "estamos
// actualizando" (HTTP 503 con {"error":"sistema_actualizando", ...}) la tienda no queda en blanco:
//  - el helper puro src/utils/tienda_actualizando.js reconoce la marca (y sólo la marca) y la
//    engancha como interceptor de respuesta en cualquier instancia de axios;
//  - store/commerce.js guarda `commerce.actualizando` (desde getCommerce, que además sigue tragando
//    el error como hasta ahora);
//  - App.vue dibuja <tienda-actualizando> FUERA del v-if="commerce" (con el comercio sin cargar no
//    habría nada que mostrar);
//  - la pantalla no depende del logo del comercio, reintenta getCommerce cada 30 s y, al liberarse,
//    hace window.location.reload();
//  - main.js instala el interceptor en las tres instancias: axios por defecto, $axios y $api.
// Los módulos se cargan DENTRO de cada test: mientras no existan, cada test falla por su cuenta.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test, mock } = require('node:test')
const babel = require('@babel/core')
const axios = require('axios')
const compiler = require('vue-template-compiler')
const Vue = require('vue')
const Vuex = require('vuex')
Vue.use(Vuex)

// Cuerpo exacto que manda tienda-api (contrato §4.4 del plan).
const marca = { error: 'sistema_actualizando', message: 'Estamos actualizando la tienda. Volvé a intentar en unos minutos.', reintentar_en_segundos: 30 }
const error_503 = (data) => ({ response: { status: 503, data, headers: {} } })
const tick = () => new Promise(r => setImmediate(r))
const src = (...partes) => path.resolve(__dirname, '..', 'src', ...partes)

// Transpila un archivo de src/ (o el <script> de un .vue) a CommonJS y resuelve '@/' contra src/.
// `reemplazos` permite sustituir librerías o módulos por dobles.
const cache = new Map()
function cargar(archivo, reemplazos = {}) {
	if (!path.extname(archivo)) archivo += '.js'
	const clave = archivo + JSON.stringify(Object.keys(reemplazos))
	if (cache.has(clave)) return cache.get(clave).exports
	let fuente = fs.readFileSync(archivo, 'utf8')
	if (archivo.endsWith('.vue')) fuente = compiler.parseComponent(fuente).script.content
	const codigo = babel.transformSync(fuente, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code
	const modulo = { exports: {} }
	cache.set(clave, modulo)
	const resolver = nombre => {
		if (Object.prototype.hasOwnProperty.call(reemplazos, nombre)) return reemplazos[nombre]
		if (nombre.startsWith('@/')) return cargar(src(nombre.slice(2)), reemplazos)
		if (nombre.startsWith('.')) return cargar(path.resolve(path.dirname(archivo), nombre), reemplazos)
		return require(nombre)
	}
	new Function('require', 'module', 'exports', codigo)(resolver, modulo, modulo.exports)
	return modulo.exports
}
const sin_comentarios = texto => texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

// Dobles para que store/commerce.js cargue sin red, sin DOM y sin config de runtime.
function cargar_store(get) {
	// Cada store lleva su propio axios simulado: se vacía la caché para no reutilizar el de otro test.
	cache.clear()
	const fake_axios = { defaults: {}, get }
	const modulo = cargar(src('store', 'commerce'), {
		axios: fake_axios,
		'@/runtime_config': { env: clave => (clave === 'VUE_APP_COMMERCE_ID' ? '7' : '') },
		'@/helpers/online_configuration_theme': { apply_online_configuration_theme() {} },
	}).default
	return new Vuex.Store({ modules: { commerce: { ...modulo, state: JSON.parse(JSON.stringify(modulo.state)) } } })
}

test('es_marca_actualizando reconoce sólo el 503 con la marca de tienda-api', () => {
	const { es_marca_actualizando } = cargar(src('utils', 'tienda_actualizando'))
	assert.equal(es_marca_actualizando(error_503(marca)), true)
	assert.equal(es_marca_actualizando(error_503({ error: 'otra_cosa' })), false, '503 con otra clave no es la marca')
	assert.equal(es_marca_actualizando(error_503(undefined)), false, '503 genérico (nginx, Laravel en down) no es la marca')
	assert.equal(es_marca_actualizando(error_503('<html>503</html>')), false, '503 con HTML no es la marca')
	assert.equal(es_marca_actualizando({ response: { status: 500, data: marca } }), false, 'la marca se exige con status 503')
	assert.equal(es_marca_actualizando({ response: { status: 404, data: { error: 'sistema_actualizando' } } }), false)
	assert.equal(es_marca_actualizando(new Error('Network Error')), false, 'sin respuesta (red caída) no es la marca')
	assert.equal(es_marca_actualizando(null), false)
	assert.equal(es_marca_actualizando(undefined), false)
})

test('el interceptor avisa ante la marca y deja pasar el mismo error al llamador', async () => {
	const { instalar_interceptor_actualizando } = cargar(src('utils', 'tienda_actualizando'))
	const avisos = []
	const instancia = axios.create({ adapter: config => Promise.reject(Object.assign(error_503(marca), { config })) })
	instalar_interceptor_actualizando(instancia, () => avisos.push('marca'))
	await assert.rejects(instancia.get('/api/lo-que-sea'), err => err.response.status === 503 && err.response.data.error === 'sistema_actualizando')
	assert.deepEqual(avisos, ['marca'])
})

test('el interceptor no avisa ante otros errores ni ante respuestas correctas', async () => {
	const { instalar_interceptor_actualizando } = cargar(src('utils', 'tienda_actualizando'))
	const avisos = []
	const con_adapter = adapter => {
		const instancia = axios.create({ adapter })
		instalar_interceptor_actualizando(instancia, () => avisos.push('marca'))
		return instancia
	}
	await assert.rejects(con_adapter(config => Promise.reject(Object.assign(error_503({}), { config }))).get('/a'))
	await assert.rejects(con_adapter(config => Promise.reject(Object.assign({ response: { status: 500, data: { message: 'x' } } }, { config }))).get('/b'))
	await assert.rejects(con_adapter(config => Promise.reject(Object.assign(new Error('Network Error'), { config }))).get('/c'))
	const ok = await con_adapter(config => Promise.resolve({ data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config })).get('/d')
	assert.deepEqual(ok.data, { ok: true })
	assert.deepEqual(avisos, [])
})

test('iniciar_reintento consulta cada 30 s, recarga una sola vez al liberarse y se puede detener', async t => {
	const { iniciar_reintento, INTERVALO_REINTENTO_MS } = cargar(src('utils', 'tienda_actualizando'))
	assert.equal(INTERVALO_REINTENTO_MS, 30000)
	mock.timers.enable({ apis: ['setInterval'] })
	t.after(() => mock.timers.reset())
	let consultas = 0, liberadas = 0, liberada = false
	const detener = iniciar_reintento(() => { consultas++; return Promise.resolve(liberada) }, () => { liberadas++ })
	mock.timers.tick(29999)
	await tick()
	assert.equal(consultas, 0, 'antes de los 30 s no consulta')
	mock.timers.tick(1)
	await tick()
	assert.equal(consultas, 1)
	assert.equal(liberadas, 0, 'sigue actualizando: no recarga')
	liberada = true
	mock.timers.tick(30000)
	await tick()
	assert.equal(consultas, 2)
	assert.equal(liberadas, 1, 'al liberarse avisa para recargar')
	mock.timers.tick(90000)
	await tick()
	assert.equal(consultas, 2, 'una vez liberada deja de consultar')
	assert.equal(liberadas, 1)
	let otras = 0
	const detener_2 = iniciar_reintento(() => { otras++; return Promise.resolve(false) }, () => {})
	detener_2()
	mock.timers.tick(120000)
	await tick()
	assert.equal(otras, 0, 'detener() corta el reintento')
	assert.equal(typeof detener, 'function')
})

test('iniciar_reintento tolera consultas que fallan y sigue intentando', async t => {
	const { iniciar_reintento } = cargar(src('utils', 'tienda_actualizando'))
	mock.timers.enable({ apis: ['setInterval'] })
	t.after(() => mock.timers.reset())
	let consultas = 0, liberadas = 0
	const detener = iniciar_reintento(() => { consultas++; return consultas < 3 ? Promise.reject(new Error('Network Error')) : Promise.resolve(true) }, () => { liberadas++ })
	for (let i = 0; i < 3; i++) { mock.timers.tick(30000); await tick() }
	assert.equal(consultas, 3)
	assert.equal(liberadas, 1)
	detener()
})

test('store commerce: arranca sin actualizar y set_actualizando lo prende y apaga', () => {
	const s = cargar_store(() => Promise.resolve({ data: {} }))
	assert.equal(s.state.commerce.actualizando, false)
	s.commit('commerce/set_actualizando', true)
	assert.equal(s.state.commerce.actualizando, true)
	s.commit('commerce/set_actualizando', false)
	assert.equal(s.state.commerce.actualizando, false)
})

test('getCommerce con la marca deja commerce.actualizando=true, sin comercio y sin romper la promesa', async () => {
	mock.method(console, 'log', () => {})
	const s = cargar_store(() => Promise.reject(error_503(marca)))
	await s.dispatch('commerce/getCommerce')
	assert.equal(s.state.commerce.actualizando, true)
	assert.equal(s.state.commerce.commerce, null)
	mock.restoreAll()
})

test('getCommerce con otro 503, un 500 o la red caída NO marca actualizando', async () => {
	mock.method(console, 'log', () => {})
	for (const error of [error_503({}), { response: { status: 500, data: { message: 'x' } } }, new Error('Network Error')]) {
		const s = cargar_store(() => Promise.reject(error))
		await s.dispatch('commerce/getCommerce')
		assert.equal(s.state.commerce.actualizando, false)
	}
	mock.restoreAll()
})

test('getCommerce correcto guarda el comercio y baja actualizando', async () => {
	mock.method(console, 'log', () => {})
	const s = cargar_store(() => Promise.resolve({ data: { commerce: { id: 7, company_name: 'Demo', online_configuration: null } } }))
	s.commit('commerce/set_actualizando', true)
	await s.dispatch('commerce/getCommerce')
	assert.equal(s.state.commerce.commerce.id, 7)
	assert.equal(s.state.commerce.actualizando, false)
	mock.restoreAll()
})

test('App.vue dibuja <tienda-actualizando v-if="actualizando"> fuera del v-if="commerce" y lo registra', () => {
	const archivo = fs.readFileSync(src('App.vue'), 'utf8')
	const partes = compiler.parseComponent(archivo)
	const { ast, errors } = compiler.compile(partes.template.content)
	assert.deepEqual(errors, [])
	let encontrado = null
	const recorrer = (nodo, dentro_de_commerce) => {
		if (!nodo || nodo.type !== 1) return
		if (nodo.tag === 'tienda-actualizando') encontrado = { nodo, dentro_de_commerce }
		const ahora = dentro_de_commerce || (nodo.if || '').trim() === 'commerce'
		;(nodo.children || []).forEach(hijo => recorrer(hijo, ahora))
		;(nodo.ifConditions || []).forEach(c => { if (c.block !== nodo) recorrer(c.block, ahora) })
	}
	recorrer(ast, false)
	assert.ok(encontrado, 'App.vue tiene que usar <tienda-actualizando>')
	assert.equal(encontrado.dentro_de_commerce, false, 'tiene que estar FUERA del v-if="commerce"')
	assert.equal(encontrado.nodo.if.trim(), 'actualizando')
	assert.match(partes.script.content, /TiendaActualizando/)
	assert.match(sin_comentarios(partes.script.content), /actualizando\s*\(\)\s*\{[\s\S]*?state\.commerce\.actualizando/)
	assert.match(archivo, /v-if="commerce"/, 'el bloque del comercio sigue como estaba')
})

test('TiendaActualizando.vue: texto de la pantalla, sin depender del logo ni del comercio', () => {
	const partes = compiler.parseComponent(fs.readFileSync(src('components', 'common', 'TiendaActualizando.vue'), 'utf8'))
	assert.match(partes.template.content, /Estamos actualizando la tienda/)
	assert.doesNotMatch(partes.template.content, /<img/, 'sin logo: el comercio todavía no cargó')
	const script = sin_comentarios(partes.script.content)
	assert.doesNotMatch(script, /logo_url|image_url|company_name|state\.commerce\.commerce|this\.commerce\b/)
	assert.match(script, /iniciar_reintento/)
	assert.match(script, /location\.reload\(\)/)
	assert.match(script, /commerce\/getCommerce/)
	assert.match(partes.styles[0].content, /^\t/m, 'SASS con tabs')
	assert.doesNotMatch(partes.styles[0].content, /^ +\S/m, 'SASS sin espacios de indentación')
})

test('TiendaActualizando.vue: reintenta getCommerce cada 30 s, recarga al liberarse y corta al destruirse', async t => {
	mock.timers.enable({ apis: ['setInterval'] })
	let recargas = 0
	global.window = { location: { reload() { recargas++ } } }
	t.after(() => { mock.timers.reset(); delete global.window })
	const Componente = cargar(src('components', 'common', 'TiendaActualizando.vue')).default
	let pedidos = 0, liberado = false
	const store = new Vuex.Store({ modules: { commerce: { namespaced: true, state: { actualizando: true, commerce: null }, mutations: { set_actualizando(s, v) { s.actualizando = v } },
		actions: { getCommerce({ commit }) { pedidos++; if (liberado) commit('set_actualizando', false); return Promise.resolve() } } } } })
	const vm = new Vue({ ...Componente, store })
	mock.timers.tick(30000)
	await tick()
	assert.equal(pedidos, 1)
	assert.equal(recargas, 0, 'sigue en actualización: no recarga')
	liberado = true
	mock.timers.tick(30000)
	await tick()
	assert.equal(pedidos, 2)
	assert.equal(recargas, 1, 'al liberarse recarga la página')
	vm.$destroy()
	const vm_2 = new Vue({ ...Componente, store })
	vm_2.$destroy()
	mock.timers.tick(120000)
	await tick()
	assert.equal(pedidos, 2, 'destruido, no vuelve a consultar')
})

test('main.js instala el interceptor en axios, $axios y $api y lo conecta al store', () => {
	const fuente = sin_comentarios(fs.readFileSync(src('main.js'), 'utf8'))
	assert.match(fuente, /from '@\/utils\/tienda_actualizando'/)
	assert.ok((fuente.match(/instalar_interceptor_actualizando\(/g) || []).length >= 3, 'tres instancias: axios, $axios y $api')
	assert.match(fuente, /instalar_interceptor_actualizando\(\s*axios\s*,/)
	assert.match(fuente, /commit\('commerce\/set_actualizando',\s*true\)/)
	assert.match(fuente, /Vue\.prototype\.\$axios\s*=/)
	assert.match(fuente, /Vue\.prototype\.\$api\s*=/)
})
