// Misión envios-andreani, ronda 2 (hallazgo 2, tienda-spa): una sucursal de Andreani puede venir sin calle o sin
// altura (el normalizador de tienda-api deja `null`). `(street + ' ' + street_number).trim()` mostraba "null" en el
// checkout (DireccionEnvio.vue) y en la pantalla de gracias (Thanks.vue). Los tres lugares que arman ese texto
// usan ahora `texto_de_calle` (src/helpers/sucursales.js).
//
// Ejecutar con: node --test tests/direccion-sucursal.test.cjs
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const babel = require('@babel/core')

const raiz = path.resolve(__dirname, '..')

/**
 * Carga un módulo ES de src/ y lo ejecuta como commonjs.
 *
 * @param {string} relativo Ruta dentro de src (ej. 'helpers/sucursales.js').
 * @returns {object} Los exports del módulo.
 */
function cargar(relativo) {
	const fuente = fs.readFileSync(path.join(raiz, 'src', relativo), 'utf8')
	const codigo = babel.transformSync(fuente, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code
	const modulo = { exports: {} }
	new Function('require', 'module', 'exports', codigo)(require, modulo, modulo.exports)
	return modulo.exports
}

const { texto_de_calle } = cargar('helpers/sucursales.js')

test('calle y número se unen con un espacio', () => {
	assert.equal(texto_de_calle({ street: 'Colectora Au.9', street_number: '1234' }), 'Colectora Au.9 1234')
})

test('sin número (null): sólo la calle, sin "null"', () => {
	assert.equal(texto_de_calle({ street: 'Av. Colón', street_number: null }), 'Av. Colón')
})

test('sin calle (null): sólo el número, sin "null"', () => {
	assert.equal(texto_de_calle({ street: null, street_number: '450' }), '450')
})

test('calle y número null, undefined o vacíos: texto vacío', () => {
	assert.equal(texto_de_calle({ street: null, street_number: null }), '')
	assert.equal(texto_de_calle({}), '')
	assert.equal(texto_de_calle({ street: '  ', street_number: '' }), '')
})

test('sin sucursal: texto vacío y no tira', () => {
	assert.equal(texto_de_calle(null), '')
	assert.equal(texto_de_calle(undefined), '')
})

test('un número real (no string) se muestra', () => {
	assert.equal(texto_de_calle({ street: 'Mitre', street_number: 120 }), 'Mitre 120')
})

test('los tres lugares que arman la dirección de la sucursal usan el helper y no concatenan a mano', () => {
	const archivos = ['components/payment/components/DireccionEnvio.vue', 'views/Thanks.vue', 'components/common/envio/EnvioOpcionCard.vue']
	archivos.forEach(archivo => {
		const fuente = fs.readFileSync(path.join(raiz, 'src', archivo), 'utf8')
		assert.match(fuente, /texto_de_calle\(/, archivo + ' tiene que usar texto_de_calle')
		assert.doesNotMatch(fuente, /\.street \+ ' ' \+ /, archivo + ' no puede concatenar street + street_number a mano')
	})
})
