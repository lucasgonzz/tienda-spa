const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const babel = require('@babel/core')
const compiler = require('vue-template-compiler')
const root = path.resolve(__dirname, '..')
function load(file) {
	const source = fs.readFileSync(path.join(root, file), 'utf8')
	const js = file.endsWith('.vue') ? compiler.parseComponent(source).script.content : source
	const code = babel.transformSync(js, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code
	const module = { exports: {} }
	new Function('require', 'module', 'exports', code)(name => {
		if (name === '@/runtime_config') return { env: () => '' }
		if (name.startsWith('@/')) return load('src/' + name.slice(2) + '.js')
		if (name.startsWith('./')) return load(path.relative(root, path.resolve(root, path.dirname(file), name)) + '.js')
		return require(name)
	}, module, module.exports)
	return module.exports
}
const { mensaje_pedido_whatsapp: mensaje, MAX_LARGO_MENSAJE } = load('src/helpers/mensaje_pedido_whatsapp.js')
const thanks = load('src/views/Thanks.vue').default
const formato = { precio: n => { assert.equal(typeof n, 'number'); assert.ok(Number.isFinite(n)); return '$ ' + n.toFixed(2) }, fecha: d => 'fecha ' + d }
const item = (name, amount = 2, price = 12) => ({ name, pivot: { amount, price } })
const pedido = () => ({ num: 28, articles: [item('Té')], total: 19, buyer: { name: 'Ana', phone: '123', email: 'NO_EMAIL', dni: 'NO_DNI' }, deliver: 0 })

test('bloques estándar sin alineación Unicode ni espacios de borde, total del servidor', () => {
	const order = pedido()
	const before = JSON.stringify(order)
	const text = mensaje(order, formato)
	assert.equal(text, '*Pedido N° 28*\n\n*Cliente:* Ana\n*Teléfono:* 123\n\n*Entrega:* Retiro por el local\n\n*Productos*\n1. Té\nCantidad: 2 unidades\nPrecio unitario: $ 12.00\nSubtotal: $ 24.00\n\n*TOTAL: $ 19.00*')
	for (const line of text.split('\n')) assert.equal(line, line.trim())
	assert.doesNotMatch(text, /[\u00a0\u2000-\u200f\u202f\u2060]|NO_EMAIL|NO_DNI/)
	assert.equal(JSON.stringify(order), before)
})

test('variantes elegidas distintas del mismo artículo, cantidad fraccionaria y sin elegir otra', () => {
	const order = pedido()
	order.articles = [
		{ ...item('Camisa', '1.5'), pivot: { amount: '1.5', price: 20, variant_id: 8 }, article_variants: [
			{ id: 7, variant_description: 'NO_ELEGIDA' },
			{ id: 8, article_property_values: [{ name: 'Azul', article_property_type: { name: 'Color' } }, { name: 'M', article_property_type: { name: 'Talle' } }] },
		] },
		{ ...item('Camisa'), pivot: { amount: 1, price: 20, variant_id: 9 }, selected_variant: { id: 9, variant_description: 'Rojo / L' } },
		{ ...item('Camisa'), pivot: { amount: 1, price: 20, variant_id: 10 }, selected_variant: { id: 7, variant_description: 'NO_ELEGIDA' } },
	]
	const text = mensaje(order, formato)
	assert.match(text, /Variante: Color: Azul, Talle: M\nCantidad: 1.5 unidades/)
	assert.match(text, /Variante: Rojo \/ L/)
	assert.match(text, /Variante: N° 10/)
	assert.doesNotMatch(text, /NO_ELEGIDA/)
})

test('combos y promociones separados, subtotales persistidos y total no recalculado', () => {
	const order = pedido()
	order.promociones_vinoteca = [{ ...item('Caja', 3, 10), pivot: { amount: 3, price: 10, subtotal: 21 } }]
	order.combos = [{ ...item('Desayuno', 4, 25), pivot: { amount: 4, price: 25, total: 80 }, articles: [item('NO_DESGLOSAR')] }]
	order.total = 102
	const text = mensaje(order, formato)
	assert.match(text, /2\. Promo: Caja\nCantidad: 3 unidades\nPrecio unitario: \$ 10.00\nSubtotal: \$ 21.00/)
	assert.match(text, /3\. Combo: Desayuno\nCantidad: 4 unidades\nPrecio unitario: \$ 25.00\nSubtotal: \$ 80.00/)
	assert.match(text, /\*TOTAL: \$ 102.00\*$/)
	assert.doesNotMatch(text, /NO_DESGLOSAR/)
})

test('ausentes, vacíos y no finitos no inventan cero, precios de catálogo ni retiro', () => {
	for (const valor of [undefined, null, '', ' ', NaN, Infinity, 'abc', false, [], {}]) {
		const order = { articles: [{ name: 'Artículo', price: 999, pivot: { amount: valor, price: valor } }], total: valor }
		const text = mensaje(order, formato)
		assert.match(text, /Cantidad: A confirmar\nPrecio unitario: A confirmar\nSubtotal: A confirmar/)
		assert.match(text, /\*TOTAL: A confirmar\*$/)
		assert.doesNotMatch(text, /NaN|undefined|null|999|\$ 0|Retiro/)
	}
	assert.doesNotThrow(() => mensaje(null, formato))
	assert.doesNotThrow(() => mensaje({ articles: [null, {}], combos: {}, promociones_vinoteca: null }, formato))
})

test('cero explícito válido y multiplicación fuera de rango no llega al formateador', () => {
	const free = mensaje({ articles: [item('Bonificado', 1, 0)], total: 0 }, formato)
	assert.match(free, /Subtotal: \$ 0.00/)
	assert.match(free, /TOTAL: \$ 0.00/)
	assert.match(mensaje({ articles: [item('Enorme', 1e200, 1e200)] }, formato), /Subtotal: A confirmar/)
})

test('CA1-08 pedido grande con variantes, promo y combo en consulta de stock llega completo, sin resumen', () => {
	const order = pedido()
	order.articles = Array.from({ length: 15 }, (_, i) => ({
		...item('Vino reserva de bodega número ' + String(i + 1).padStart(2, '0')),
		pivot: { amount: 2, price: 12, variant_id: 5 },
		selected_variant: { id: 5, article_property_values: [{ name: 'Malbec', article_property_type: { name: 'Tipo' } }] },
	}))
	order.combos = [{ ...item('Combo'), pivot: { amount: 1, price: 4, stock_a_consultar: 1 } }]
	order.promociones_vinoteca = [item('Promo')]
	Object.assign(order, { deliver: 1, address: 'Calle 1 Piso 2', envio_opcion: {} })
	const text = mensaje(order, { ...formato, texto_envio: 'Envío: Correo' })
	assert.ok(text.length <= MAX_LARGO_MENSAJE, 'largo ' + text.length)
	for (const parte of ['*Cliente:* ', '*Teléfono:* ', '*Entrega:* Envío a domicilio', '*Dirección:* ', 'Variante: Tipo: Malbec', 'Disponibilidad a confirmar', 'TOTAL ESTIMADO: $ 19.00', 'Promo: Promo', 'Combo: Combo']) {
		assert.ok(text.includes(parte), parte)
	}
	for (let i = 1; i <= 15; i++) assert.ok(text.includes('Vino reserva de bodega número ' + String(i).padStart(2, '0')), 'artículo ' + i)
	assert.doesNotMatch(text, /productos más|Pedido de /)
})

test('CA1-07 pedido corto: el texto no cambia respecto del que producía el helper antes de la corrección', () => {
	const order = pedido()
	order.articles = [item('Té'), item('Yerba mate', 1, 35)]
	Object.assign(order, { total: 59, deliver: 1, address: 'Calle 1 Piso 2', description: 'Tocar timbre' })
	assert.equal(mensaje(order, { ...formato, texto_envio: 'Envío: Correo · $ 20' }),
		'*Pedido N° 28*\n\n*Cliente:* Ana\n*Teléfono:* 123\n\n*Entrega:* Envío a domicilio\n*Dirección:* Calle 1 Piso 2\n\n*Productos*\n1. Té\nCantidad: 2 unidades\nPrecio unitario: $ 12.00\nSubtotal: $ 24.00\n\n2. Yerba mate\nCantidad: 1 unidades\nPrecio unitario: $ 35.00\nSubtotal: $ 35.00\n\n*TOTAL: $ 59.00*\n\n*Observaciones:* Tocar timbre')
})

test('CA1-09 80 artículos largos: datos del cliente y total intactos y recorte ordenado de productos', () => {
	const order = pedido()
	order.articles = Array.from({ length: 80 }, (_, i) => item(('Artículo ' + String(i + 1).padStart(2, '0') + ' ').padEnd(120, 'x')))
	Object.assign(order, { deliver: 1, address: 'Calle 1 Piso 2', total: 1234 })
	const text = mensaje(order, formato)
	assert.ok(text.length <= MAX_LARGO_MENSAJE, 'largo ' + text.length)
	for (const parte of ['*Cliente:* Ana', '*Teléfono:* 123', '*Entrega:* Envío a domicilio', '*Dirección:* Calle 1 Piso 2', '*TOTAL: $ 1234.00*']) {
		assert.ok(text.includes(parte), parte)
	}
	const listados = order.articles.filter(a => text.includes(a.name)).length
	assert.ok(listados > 0 && listados < 80, 'listados ' + listados)
	for (let i = 0; i < 80; i++) assert.equal(text.includes(order.articles[i].name), i < listados, 'orden en ' + (i + 1))
	const resto = text.match(/… y (\d+) productos más \(detalle completo en el pedido\)/)
	assert.ok(resto, 'línea de productos restantes')
	assert.equal(Number(resto[1]), 80 - listados)
	assert.ok(text.indexOf(resto[0]) < text.indexOf('*TOTAL'))
})

test('CA1-10 datos personales enormes se acotan sin perder etiquetas ni producto', () => {
	const order = pedido()
	Object.assign(order, { num: '9'.repeat(3000), deliver: 1, address: 'B'.repeat(3000), description: 'C'.repeat(3000) })
	order.buyer.name = 'A'.repeat(3000)
	const text = mensaje(order, formato)
	assert.ok(text.length <= MAX_LARGO_MENSAJE, 'largo ' + text.length)
	for (const parte of ['*Cliente:* ', '*Dirección:* ', '*Entrega:* Envío a domicilio', '*TOTAL', '1. Té', '*Observaciones:* ']) {
		assert.ok(text.includes(parte), parte)
	}
})

test('entrega y datos preexistentes sin PII adicional ni formato inyectado', () => {
	const order = pedido()
	order.buyer.phone = ''
	order.buyer.comercio_city_client = { phone: '456', email: 'NO_EMAIL' }
	Object.assign(order, { deliver: '1', address: 'Calle 1\nPiso 2', envio_opcion: {}, fecha_entrega: '2026-11-20', description: '*Notas*\n_dos_' })
	const text = mensaje(order, { ...formato, texto_envio: 'Envío: Correo · $ 20' })
	assert.match(text, /Teléfono:\* 456/)
	assert.match(text, /Dirección:\* Calle 1 Piso 2\nEnvío: Correo · \$ 20/)
	assert.match(text, /Fecha de entrega:\* fecha 2026-11-20/)
	assert.match(text, /Observaciones:\* Notas dos/)
	assert.doesNotMatch(text, /NO_EMAIL/)
})

test('Thanks integra el helper real y codifica sólo una vez caracteres especiales', () => {
	const order = pedido()
	order.articles[0].name = 'Té & café + 50% # 😀'
	order.description = '100% listo? a=b'
	const context = { order, commerce_whatsapp_phone: '5491141234567', price: formato.precio, date: formato.fecha, texto_envio_zipnova: '', pedido_a_consultar: false }
	thanks.methods.set_whatsapp_link.call(context)
	const url = new URL(context.whatsapp_link)
	assert.equal(url.origin + url.pathname, 'https://wa.me/5491141234567')
	assert.equal(url.searchParams.get('text'), mensaje(order, { ...formato, texto_envio: '', a_consultar: false }))
	assert.match(url.searchParams.get('text'), /Té & café \+ 50% # 😀/)
	assert.equal(Array.from(url.searchParams.keys()).length, 1)
	for (const invalid of [{ ...context, order: null }, { ...context, commerce_whatsapp_phone: '' }]) {
		thanks.methods.set_whatsapp_link.call(invalid)
		assert.equal(invalid.whatsapp_link, '')
	}
})

test('texto de envío de Thanks no transforma ausencia en envío gratis ni nombres undefined', () => {
	for (const envio_precio of [undefined, null, '', ' ', false, NaN, Infinity]) {
		assert.equal(thanks.computed.texto_envio_zipnova.call({ order: { envio_opcion: { carrier_name: 'Correo' }, envio_precio }, price: formato.precio }), 'Envío: Correo')
	}
	assert.equal(thanks.computed.texto_envio_zipnova.call({ order: { envio_opcion: { carrier_name: 'Correo', service_name: 'Domicilio' }, envio_precio: '0' }, price: formato.precio }), 'Envío: Correo · Domicilio · Gratis')
})

// ── Ronda 2 de CA-1: el corte por tope no puede partir un par sustituto (emoji) ──
// Un sustituto suelto hace que encodeURIComponent (Thanks.vue) lance URIError y el comprador no pueda enviar el pedido.
const SUSTITUTO_SUELTO = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/
// Arma un texto largo con un emoji que arranca en `inicio` (cerca del borde del tope) y sigue con relleno.
const con_emoji_en = (inicio, emoji = '🍷') => 'a'.repeat(inicio) + emoji + 'b'.repeat(40)
// Cada campo con tope: cómo cargar el texto en el pedido y su tope.
const CAMPOS_CON_TOPE = {
	nombre: [80, (o, t) => { o.buyer.name = t }],
	direccion: [300, (o, t) => { o.deliver = 1; o.address = t }],
	observaciones: [500, (o, t) => { o.description = t }],
	producto: [120, (o, t) => { o.articles = [item(t)] }],
	variante: [160, (o, t) => { o.articles = [{ ...item('Té'), pivot: { amount: 2, price: 12, variant_id: 5 }, selected_variant: { id: 5, variant_description: t } }] }],
	numero: [30, (o, t) => { o.num = t }],
}
for (const [campo, [tope, cargar]] of Object.entries(CAMPOS_CON_TOPE)) {
	test('CA1b-' + campo + ' el corte en el tope no deja sustitutos sueltos ni rompe encodeURIComponent', () => {
		for (const emoji of ['🍷', '🙏']) {
			for (let corrimiento = 0; corrimiento <= 3; corrimiento++) {
				const order = pedido()
				cargar(order, con_emoji_en(tope - 4 + corrimiento, emoji))
				const text = mensaje(order, formato)
				assert.doesNotMatch(text, SUSTITUTO_SUELTO, campo + ' corrimiento ' + corrimiento)
				assert.doesNotThrow(() => encodeURIComponent(text), campo + ' corrimiento ' + corrimiento)
				assert.ok(text.length <= MAX_LARGO_MENSAJE)
			}
		}
	})
}
test('CA1b-observaciones repetidas con emoji (caso del Revisor) se codifican sin error', () => {
	const order = pedido()
	order.description = 'Por favor tocar timbre 🙏 '.repeat(40)
	const text = mensaje(order, formato)
	assert.doesNotMatch(text, SUSTITUTO_SUELTO)
	assert.doesNotThrow(() => encodeURIComponent(text))
})
