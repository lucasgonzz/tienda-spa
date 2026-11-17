const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const babel = require('@babel/core')
const Vue = require('vue')
const compiler = require('vue-template-compiler')

Vue.config.productionTip = false
const archivo = path.join(__dirname, '../src/components/password-reset/components/Form.vue')
const fuente = compiler.parseComponent(fs.readFileSync(archivo, 'utf8'))
const codigo = babel.transformSync(fuente.script.content, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code
const modulo = { exports: {} }
new Function('require', 'module', 'exports', codigo)(nombre => {
	if (nombre === '@/runtime_config') return { env: nombre => nombre === 'VUE_APP_COMMERCE_ID' ? '5100' : '' }
	if (nombre === '@/mixins/auth') return {}
	if (nombre === '@/components/common/BtnLoader') return {}
	throw new Error('Dependencia inesperada: ' + nombre)
}, modulo, modulo.exports)
const componente = modulo.exports.default
const pausa = () => new Promise(resolve => setImmediate(resolve))
const mensaje = 'No podemos guardar de forma segura el código de recuperación. Probá más tarde o avisale al comercio para que contacte a soporte.'

function formulario(status = 422, datos = { message: mensaje, error_code: 'password_reset_storage_unavailable' }) {
	const vm = new Vue(componente)
	const mensajes = []
	const pedidos = []
	vm.$toast = { error: texto => mensajes.push(texto) }
	vm.$axios = { post: (url, payload) => {
		pedidos.push({ url, payload })
		return Promise.reject({ response: { status, data: datos } })
	} }
	vm.register_user.email = ' comprador@test.local '
	vm.register_user.verification_code = '1234'
	vm.register_user.password = 'clave-nueva-prueba'
	vm.register_user.password_confirm = 'clave-nueva-prueba'
	return { vm, mensajes, pedidos }
}

for (const [metodo, loader, paso] of [['sendCode', 'loading', 1], ['checkVerificationCode', 'loading_verification_code', 2], ['updatePassword', 'loading_update_password', 3]]) {
	test('Fallo persistente al ejecutar ' + metodo + ': explica el problema y conserva el paso para reintentar', async () => {
		const { vm, mensajes, pedidos } = formulario()
		vm.verification_code_send = paso > 1
		vm.code_verified = paso > 2
		vm[metodo]()
		await pausa()
		assert.deepEqual(mensajes, [mensaje])
		assert.equal(vm[loader], false)
		assert.equal(vm.current_step, paso)
		assert.equal(pedidos[0].payload.email, 'comprador@test.local')
		assert.equal(pedidos[0].payload.commerce_id, '5100')
		vm.$destroy()
	})
}

test('Un código inválido al cambiar la clave conserva el regreso al primer paso', async () => {
	const { vm, mensajes } = formulario(422, { message: 'El código venció o no es correcto. Pedí uno nuevo.' })
	vm.verification_code_send = true
	vm.code_verified = true
	vm.updatePassword()
	await pausa()
	assert.equal(vm.current_step, 1)
	assert.equal(vm.register_user.verification_code, '')
	assert.deepEqual(mensajes, ['El código venció o no es correcto. Pedí uno nuevo.'])
	vm.$destroy()
})

test('Una excepción interna al verificar no muestra el detalle técnico', async () => {
	const { vm, mensajes } = formulario(500, { message: 'detalle interno reservado' })
	vm.verification_code_send = true
	vm.checkVerificationCode()
	await pausa()
	assert.deepEqual(mensajes, ['No pudimos verificar el código. Probá de nuevo en unos minutos.'])
	assert.equal(vm.current_step, 2)
	vm.$destroy()
})
