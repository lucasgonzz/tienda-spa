const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const babel = require('@babel/core')
function load(name, document) {
	const source = fs.readFileSync(path.resolve(__dirname, '../src', name + '.js'), 'utf8')
	const code = babel.transformSync(source, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code
	const module = { exports: {} }
	new Function('require', 'module', 'exports', 'document', code)(
		name => load(name.replace('@/', ''), document), module, module.exports, document)
	return module.exports
}
const theme = load('helpers/online_configuration_theme')
const { contrast_ratio } = load('helpers/color_contrast')
// Oráculo WCAG independiente del helper usado en producción.
function ratio(a, b) {
	function luminance(color) {
		if (color.length === 4) color = '#' + [...color.slice(1)].map(c => c + c).join('')
		const rgb = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16) / 255)
		return rgb.map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4)
			.reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0)
	}
	const values = [luminance(a), luminance(b)].sort((a, b) => b - a)
	return (values[0] + .05) / (values[1] + .05)
}
// Oráculo de la adenda B: fondo aceptable = ≥1,5:1 contra todas las superficies y, si es gris (croma < 0,10), ≥3:1.
function acceptable(color, surfaces = ['#FFFFFF']) {
	if (color.length === 4) color = '#' + [...color.slice(1)].map(c => c + c).join('')
	const channels = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16))
	const chroma = (Math.max(...channels) - Math.min(...channels)) / 255
	const lowest = Math.min(...surfaces.map(surface => ratio(color, surface)))
	return lowest >= 1.5 && (chroma >= .1 || lowest >= 3)
}
function readable(palette) {
	for (const [state, colors] of Object.entries(palette)) {
		assert.ok(ratio(colors.background, colors.text) >= 4.5, state + ': ' + JSON.stringify(colors))
	}
}
test('U3-01 normalización estricta: cortos, largos, espacios y rechazo de CSS arbitrario', () => {
	assert.equal(theme.normalize_hex_color(' #aBc ', '#000000'), '#aBc')
	assert.equal(theme.normalize_hex_color(' #abC123 ', '#000000'), '#abC123')
	for (const value of [null, undefined, 3, {}, [], 'red', '#abcd', '#12345678', 'var(--x)', '#fff; color:red', '123456']) {
		assert.equal(theme.normalize_hex_color(value, '#245269'), '#245269')
	}
})
test('U3-02 configuración ausente o inválida usa fallback genérico legible', () => {
	const expected = theme.resolve_checkout_colors(null)
	assert.equal(expected.normal.background, '#245269')
	for (const config of [undefined, {}, { primary_color: 'invalid', text_color: {}, hover_text_color: [] }]) {
		assert.deepEqual(theme.resolve_checkout_colors(config), expected)
		readable(theme.resolve_checkout_colors(config))
	}
})
test('U3-03 claro, oscuro e intermedio mantienen AA en TODOS los estados', () => {
	for (const primary of ['#fff', '#000', '#ffff00', '#777777', '#767676', '#123456', '#abcdef']) {
		const palette = theme.resolve_checkout_colors({ primary_color: primary, text_color: primary, hover_text_color: primary })
		// CA1.4: criterio más exigente. El fondo del botón no es el primario a ciegas: sólo es el primario cuando éste ya contrasta (no se cambia a quien estaba bien).
		// Decisión de Lucas 23/11/2026, adenda B: sólo blancos y grises claros
		assert.ok(acceptable(palette.normal.background), primary + ' → ' + palette.normal.background)
		assert.ok(acceptable(palette.normal.background), 'background_color por defecto')
		if (ratio(primary, '#FFFFFF') >= 3) assert.equal(palette.normal.background, primary)
		// Decisión del Coordinador (23/11/2026) por CA1.4: el fondo ya no es siempre el primario, así que el texto
		// sólo se compara con el primario cuando éste fue el fondo elegido; siempre debe diferir del fondo real.
		if (palette.normal.background === primary) assert.notEqual(palette.normal.text, primary)
		assert.notEqual(palette.normal.text, palette.normal.background)
		assert.notEqual(palette.hover.background, palette.normal.background)
		assert.notEqual(palette.processing.background, palette.hover.background)
		assert.notEqual(palette.processing.background, palette.disabled.background)
		readable(palette)
	}
})
test('U3-04 conserva texto configurado válido sólo cuando contrasta; caso límite del casi negro', () => {
	assert.equal(theme.resolve_checkout_colors({ primary_color: '#000', text_color: '#ff0000' }).normal.text, '#ff0000')
	assert.notEqual(theme.resolve_checkout_colors({ primary_color: '#000', text_color: '#ff0000' }).hover.background, '#000000')
	assert.equal(theme.resolve_checkout_colors({ primary_color: '#777777', text_color: '#777777' }).normal.text, '#000000')
	assert.ok(contrast_ratio('#777777', '#111111') < 4.5)
	readable(theme.resolve_checkout_colors({ primary_color: '#777777' }))
})
test('U3-05 barrido RGB: estados opacos y AA incluso alrededor del umbral', () => {
	for (let r = 0; r <= 255; r += 17) for (let g = 0; g <= 255; g += 17) for (let b = 0; b <= 255; b += 17) {
		const primary = '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')
		readable(theme.resolve_checkout_colors({ primary_color: primary, text_color: '#777777', hover_text_color: '#888888' }))
	}
})
test('U3-06 aplicación publica todos los estados y no conserva colores del comercio anterior', () => {
	const properties = {}
	const runtime = load('helpers/online_configuration_theme', { documentElement: { style: { setProperty(k, v) { properties[k] = v } } } })
	runtime.apply_online_configuration_theme({ primary_color: '#abc', text_color: '#000' })
	for (const [state, colors] of Object.entries(theme.resolve_checkout_colors({ primary_color: '#abc', text_color: '#000' }))) {
		assert.equal(properties['--checkout-' + state + '-background'], colors.background)
		assert.equal(properties['--checkout-' + state + '-text'], colors.text)
	}
	runtime.apply_online_configuration_theme(null)
	assert.equal(properties['--checkout-normal-background'], '#245269')
})
test('U3-07 resultados consumen acciones temáticas sin variar destinos ni condicional autenticado', () => {
	const compiler = require('vue-template-compiler')
	for (const view of ['PaymentSuccess', 'PaymentPending', 'PaymentFailure']) {
		const file = fs.readFileSync(path.resolve(__dirname, '../src/views', view + '.vue'), 'utf8')
		const template = compiler.parseComponent(file).template.content
		assert.deepEqual(compiler.compile(template).errors, [])
		assert.match(template, /class="payment-result__action--primary"/)
		assert.match(template, /class="payment-result__action--secondary"/)
		assert.match(template, /v-if="authenticated"/)
		assert.match(template, /name: 'Orders'/)
		assert.match(template, /name: 'Home'/)
		assert.doesNotMatch(template, /variant="success"|variant="outline-secondary"/)
	}
})
test('U3-08 procesamiento accesible, bloqueo nativo, foco sólido y sin filtros que rompan AA', () => {
	const compiler = require('vue-template-compiler')
	const file = fs.readFileSync(path.resolve(__dirname, '../src/components/payment/components/BtnSave.vue'), 'utf8')
	const template = compiler.parseComponent(file).template.content
	assert.deepEqual(compiler.compile(template).errors, [])
	assert.match(template, /:disabled="procesando"/)
	assert.match(template, /:aria-busy="procesando/)
	assert.match(template, /role="status"/)
	assert.match(template, /checkout-confirm__btn--processing/)
	const sass = fs.readFileSync(path.resolve(__dirname, '../src/sass/_checkout.sass'), 'utf8')
	assert.doesNotMatch(sass, /outline: none|filter: brightness|checkout-confirm__btn--mp/)
	assert.match(sass, /outline: 3px solid #000 !important/)
	assert.match(sass, /box-shadow: 0 0 0 3px #FFF !important/)
	assert.match(sass, /border-style: dashed !important/)
})

// ── Corrección A (CA-1): el botón principal tiene que verse activo aunque el primario sea casi blanco ──
// Configuración real de Truvari (T), leída de su API pública el 23/11/2026.
const T = { primary_color: '#E9E7EA', secondary_color: '#250237', add_to_cart_button_color: '#250237', text_color: '#464646', hover_text_color: '#FFF', background_color: '#FFFFFF' }
const normal_background = config => theme.resolve_checkout_colors(config).normal.background
test('CA1-01 con la configuración de Truvari el botón es violeta oscuro con texto blanco', () => {
	const palette = theme.resolve_checkout_colors(T)
	assert.deepEqual(palette.normal, { background: '#250237', text: '#FFFFFF' })
})
test('CA1-02 hover, foco y procesando legibles; secundario violeta; desactivado blanco y distinguible', () => {
	const palette = theme.resolve_checkout_colors(T)
	for (const state of ['hover', 'focus', 'processing']) {
		// Decisión de Lucas 23/11/2026, adenda B: sólo blancos y grises claros
		assert.ok(acceptable(palette[state].background), state + ' fondo: ' + palette[state].background)
		assert.ok(ratio(palette[state].background, palette[state].text) >= 4.5, state + ' texto')
	}
	assert.equal(palette.secondary.text, '#250237')
	assert.deepEqual(palette.disabled, { background: '#FFFFFF', text: '#6B6B6B' })
	// Decisión de Lucas 23/11/2026, adenda B: sólo blancos y grises claros
	assert.ok(ratio(palette.normal.background, palette.disabled.background) >= 1.5)
})
test('CA1-03 orden de candidatos: primario, botón de agregar, secundario y neutro', () => {
	const claro = '#E9E7EA'
	assert.equal(normal_background({ primary_color: claro, add_to_cart_button_color: null, secondary_color: '#250237' }), '#250237')
	assert.equal(normal_background({ primary_color: claro, add_to_cart_button_color: '#FFEEEE', secondary_color: '#123456' }), '#123456')
	// Decisión de Lucas 23/11/2026, adenda B: sólo blancos y grises claros
	assert.equal(normal_background({ primary_color: claro, add_to_cart_button_color: 'bad', secondary_color: '#fe7802' }), '#fe7802')
	assert.equal(normal_background({ primary_color: '#c5111d', add_to_cart_button_color: '#250237', secondary_color: '#123456' }), '#c5111d')
})
test('CA1-04 el reemplazo de U3-03 es más exigente: un primario claro nunca queda como fondo', () => {
	for (const primary of ['#fff', '#ffff00', '#E9E7EA']) {
		assert.notEqual(normal_background({ primary_color: primary }), primary, primary)
	}
	// Decisión de Lucas 23/11/2026, adenda B: sólo blancos y grises claros (celeste pastel con tono, se conserva)
	const pastel = theme.resolve_checkout_colors({ primary_color: '#abcdef' }).normal
	assert.equal(pastel.background, '#abcdef')
	assert.ok(ratio(pastel.background, pastel.text) >= 4.5)
	for (const primary of ['#000', '#123456', '#767676']) {
		assert.equal(normal_background({ primary_color: primary }), primary, primary)
	}
})
test('CA1-05 barrido RGB con fondo blanco y gris: fondo ≥3:1, textos AA y activo distinto del desactivado', () => {
	for (const page of ['#FFFFFF', '#EDEDED']) {
		for (let r = 0; r <= 255; r += 17) for (let g = 0; g <= 255; g += 17) for (let b = 0; b <= 255; b += 17) {
			const primary = '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')
			const palette = theme.resolve_checkout_colors({ primary_color: primary, text_color: '#777777', hover_text_color: '#888888', background_color: page })
			readable(palette)
			for (const state of ['normal', 'hover', 'focus', 'processing']) {
				for (const surface of ['#FFFFFF', page]) {
					// Decisión de Lucas 23/11/2026, adenda B: sólo blancos y grises claros
					assert.ok(acceptable(palette[state].background, ['#FFFFFF', page]), page + ' ' + primary + ' ' + state + ' ' + palette[state].background)
				}
			}
			assert.ok(ratio(palette.normal.background, palette.disabled.background) >= 1.5, primary)
		}
	}
})
test('CA1-06 SASS: desactivado con contorno punteado gris y procesando con su propio borde punteado', () => {
	const sass = fs.readFileSync(path.resolve(__dirname, '../src/sass/_checkout.sass'), 'utf8')
	const disabled = sass.match(/&:disabled,\n\t&\.disabled\n((?:\t\t.*\n)+)/)
	assert.ok(disabled, 'bloque desactivado')
	assert.match(disabled[1], /border: 2px dashed #8A8A8A !important/)
	assert.match(disabled[1], /cursor: not-allowed/)
	const processing = sass.match(/&\.checkout-confirm__btn--processing:disabled\n((?:\t\t.*\n)+)/)
	assert.ok(processing, 'bloque procesando')
	assert.match(processing[1], /border: 2px dashed currentColor !important/)
	assert.match(sass, /border-style: dashed !important/)
})

// ── Adenda B: sólo se reemplazan los blancos y grises claros; los colores con tono conservan su color de marca ──
// "Negro" en la SPA es '#111111' (best_text_on) o '#000000' cuando '#111111' no llega a 4,5:1 (caso #777777).
const NEGRO = ['#111111', '#000000']
test('CA1c-01 tabla de valores esperados: fondo y texto del botón principal', () => {
	const casos = [
		// [primario, botón carrito, secundario, fondo esperado, texto esperado (o null = negro)]
		['#E9E7EA', '#250237', '#250237', '#250237', '#FFFFFF'],
		['#FF9800', null, '#fe7802', '#FF9800', null],
		['#4CAF50', null, null, '#4CAF50', null],
		['#FFC107', null, null, '#FFC107', null],
		['#03A9F4', null, null, '#03A9F4', null],
		['#fe7802', null, null, '#fe7802', null],
		['#CCCCCC', null, '#250237', '#250237', '#FFFFFF'],
		['#CCCCCC', null, null, '#245269', '#FFFFFF'],
		['#FFF9C4', null, '#fe7802', '#fe7802', null],
		['#777777', null, null, '#777777', '#000000'],
		['#c5111d', null, null, '#c5111d', '#FFFFFF'],
		['#fff', null, '#fe7802', '#fe7802', null],
	]
	for (const [primary, carrito, secundario, fondo, texto] of casos) {
		const normal = theme.resolve_checkout_colors({ primary_color: primary, add_to_cart_button_color: carrito, secondary_color: secundario }).normal
		assert.equal(normal.background, fondo, primary + ' fondo')
		if (texto) assert.equal(normal.text, texto, primary + ' texto')
		else assert.ok(NEGRO.includes(normal.text), primary + ' texto negro: ' + normal.text)
		assert.ok(ratio(normal.background, normal.text) >= 4.5, primary + ' contraste del texto')
	}
})
test('CA1c-02 el secundario toma el color de marca si se lee sobre blanco y si no, texto oscuro', () => {
	const naranja = theme.resolve_checkout_colors({ primary_color: '#FF9800' }).secondary
	assert.equal(naranja.background, '#FFFFFF')
	assert.ok(ratio(naranja.background, naranja.text) >= 4.5)
	assert.ok(NEGRO.includes(naranja.text), naranja.text)
	assert.equal(theme.resolve_checkout_colors({ primary_color: '#c5111d' }).secondary.text, '#c5111d')
})
test('CA1c-03 hover, foco y procesando de un color con tono siguen siendo aceptables y legibles', () => {
	for (const primary of ['#FF9800', '#4CAF50', '#FFC107', '#03A9F4', '#fe7802']) {
		const palette = theme.resolve_checkout_colors({ primary_color: primary })
		for (const state of ['hover', 'focus', 'processing']) {
			assert.ok(acceptable(palette[state].background), primary + ' ' + state + ' ' + palette[state].background)
			assert.ok(ratio(palette[state].background, palette[state].text) >= 4.5, primary + ' ' + state + ' texto')
		}
		assert.notEqual(palette.hover.background, palette.normal.background, primary)
	}
})
