/*
 * Misión og-imagen-android (CA24-CA28): metas Open Graph completas y al principio del head.
 * Corre public/seo.php por CLI mediante tests/seo-php/armar-html.php (define SEO_SIN_EJECUTAR para
 * cargar las funciones sin ejecutar el flujo principal). PHP: process.env.PHP_BIN o `php`.
 */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { test } = require('node:test')

const raiz = path.resolve(__dirname, '..')
const php = process.env.PHP_BIN || 'php'
const runner = path.join(raiz, 'tests', 'seo-php', 'armar-html.php')

// URL nueva del conversor (termina en .jpg) y variantes que NO deben declarar medidas
const URL_NUEVA = 'https://api.x.com.ar/public/api/seo/imagen-compartir/aHR0cHM6Ly9h.jpg'
const URL_VIEJA = 'https://api.x.com.ar/public/api/seo/imagen-compartir?src=https%3A%2F%2Fcdn.test%2Fa.webp'
const URL_LOGO = 'https://api-x.comerciocity.com/public/storage/logo.png'

// Ejecuta el runner PHP con la entrada dada y devuelve su stdout
function correr(entrada) {
	const r = spawnSync(php, [runner], { input: JSON.stringify(entrada), encoding: 'utf8' })
	assert.equal(r.status, 0, 'el runner PHP debe terminar bien. stderr: ' + r.stderr + ' stdout: ' + r.stdout.slice(0, 300))
	return r.stdout
}

// Datos con las nueve claves del contrato, con la imagen indicada
function datos(imagen) {
	return {
		estado: 200,
		titulo: 'Malbec "Reserva" & Cia',
		descripcion: 'Descripcion corta',
		canonica: 'https://tienda.test/producto/malbec',
		imagen: imagen,
		robots: 'index,follow',
		og_type: 'product',
		json_ld: [],
		cuerpo_html: '<p>x</p>',
	}
}

const INDEX_REAL = fs.readFileSync(path.join(raiz, 'public', 'index.html'), 'utf8')

// Index mínimo con los marcadores y el contenedor de la app
const INDEX_MINIMO = '<!DOCTYPE html><html><head><meta charset="utf-8"><!--seo:head--><title data-seo>x</title><!--/seo:head--></head><body><div id=app></div></body></html>'

// Devuelve las etiquetas <meta ... > del HTML en orden
function metas(html) {
	return html.match(/<meta data-seo [^>]*>/g) || []
}

// Clave de cada meta (property o name)
function clave(meta) {
	const m = meta.match(/(?:property|name)="([^"]+)"/)
	return m ? m[1] : ''
}

test('CA24: URL nueva .jpg declara og:image completo, contiguo y en orden, con alt y twitter', () => {
	const html = correr({ index: INDEX_MINIMO, datos: datos(URL_NUEVA) })
	const lista = metas(html)
	const claves = lista.map(clave)
	const i = claves.indexOf('og:image')
	assert.ok(i >= 0, 'falta og:image')
	assert.deepEqual(claves.slice(i, i + 6), [
		'og:image', 'og:image:secure_url', 'og:image:type', 'og:image:width', 'og:image:height', 'og:image:alt',
	])
	assert.ok(lista[i].includes('content="' + URL_NUEVA + '"'))
	assert.ok(lista[i + 1].includes('content="' + URL_NUEVA + '"'))
	assert.ok(lista[i + 2].includes('content="image/jpeg"'))
	assert.ok(lista[i + 3].includes('content="1200"'))
	assert.ok(lista[i + 4].includes('content="630"'))
	// El alt es el título escapado
	assert.ok(lista[i + 5].includes('content="Malbec &quot;Reserva&quot; &amp; Cia"'), lista[i + 5])
	assert.ok(claves.includes('twitter:image'))
	assert.ok(claves.includes('twitter:image:alt'))
	assert.equal((html.match(/property="og:image"/g) || []).length, 1)
	// Todas llevan data-seo (la regex de metas ya lo exige): ninguna og:image* sin data-seo
	assert.equal((html.match(/<meta (?![^>]*data-seo)[^>]*og:image/g) || []).length, 0)
})

test('CA25: logo directo o ruta vieja no declaran tipo ni medidas; sin imagen no hay og:image*', () => {
	[URL_LOGO, URL_VIEJA].forEach(function (url) {
		const html = correr({ index: INDEX_MINIMO, datos: datos(url) })
		assert.ok(html.includes('property="og:image"'))
		assert.ok(html.includes('property="og:image:secure_url"'))
		assert.ok(html.includes('property="og:image:alt"'))
		assert.ok(!html.includes('og:image:type'))
		assert.ok(!html.includes('og:image:width'))
		assert.ok(!html.includes('og:image:height'))
	})
	const sin = correr({ index: INDEX_MINIMO, datos: datos(null) })
	assert.ok(!sin.includes('og:image'))
	assert.ok(!sin.includes('twitter:image'))
	assert.ok(sin.includes('name="twitter:card" content="summary"'))
})

test('CA26: el contrato de nueve claves sigue validando y sin imagen da null', () => {
	const completo = JSON.stringify(datos(URL_NUEVA))
	const ok = JSON.parse(correr({ modo: 'validar', json: completo }))
	assert.equal(ok.imagen, URL_NUEVA)
	const sinImagen = datos(null)
	const res = JSON.parse(correr({ modo: 'validar', json: JSON.stringify(sinImagen) }))
	assert.equal(res.imagen, null)
	// Falta una clave -> el contrato se rechaza
	const incompleto = datos(URL_NUEVA)
	delete incompleto.og_type
	assert.equal(correr({ modo: 'validar', json: JSON.stringify(incompleto) }), 'NULL')
})

// Quita comentarios que no son marcadores, como hace el build (ignoreCustomComments)
function sinComentarios(html) {
	return html.replace(/<!--(?!\/?seo:head-->)[\s\S]*?-->/g, '')
}

test('CA27: en index.html la región SEO va antes de cualquier script, link o style', () => {
	const inicio = INDEX_REAL.indexOf('<head>')
	const marca = INDEX_REAL.indexOf('<!--seo:head-->')
	assert.ok(inicio >= 0 && marca > inicio)
	// El <noscript> con su <style> es inocuo: no se cuenta
	const previo = sinComentarios(INDEX_REAL.slice(inicio, marca)).replace(/<noscript>[\s\S]*?<\/noscript>/g, '')
	assert.ok(!/<script/i.test(previo), 'hay <script antes de la region SEO')
	assert.ok(!/<link/i.test(previo), 'hay <link antes de la region SEO')
	assert.ok(!/<style/i.test(previo), 'hay <style antes de la region SEO')
	// og:image queda en los primeros 1024 bytes del HTML armado
	const index = sinComentarios(INDEX_REAL)
	const html = correr({ index: index, datos: datos(URL_NUEVA) })
	const pos = Buffer.from(html, 'utf8').indexOf('property="og:image"')
	assert.ok(pos > 0 && pos < 1024, 'og:image en el byte ' + pos)
})

test('CA28: seo_armar_html con el index real reemplaza la región y el #app', () => {
	const html = correr({ index: INDEX_REAL, datos: datos(URL_NUEVA) })
	assert.notEqual(html, 'NULL')
	assert.ok(html.includes('class="seo-contenido"'))
	assert.ok(html.includes('property="og:image:width"'))
})
