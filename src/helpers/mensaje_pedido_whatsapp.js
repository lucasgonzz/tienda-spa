import { tiene_marca_consulta_stock, variante_de_linea } from './consultas_de_stock'

// Reutiliza los bloques del helper previo; sin columnas ni sangrías Unicode.
// Presupuesto de caracteres del texto sin codificar. WhatsApp admite 65 536; 4000 deja holgura
// (un pedido de 15 productos con variante entra entero). Nunca se reemplaza el pedido por un resumen:
// si no entran todos los productos se listan los primeros y se avisa cuántos faltan.
export const MAX_LARGO_MENSAJE = 4000

// Topes por campo de texto libre (caracteres). Al cortar se agrega "…".
const TOPES = { numero: 30, nombre: 80, telefono: 40, direccion: 300, envio: 200, observaciones: 500, producto: 120, variante: 160 }

/**
 * Corta un texto ya limpio al tope indicado, agregando "…" si hubo recorte.
 * @param {string} texto
 * @param {number} tope
 * @returns {string}
 */
function acotar(texto, tope) {
	if (texto.length <= tope) {
		return texto
	}
	let corte = texto.slice(0, tope - 1)
	// Si el corte cayó en medio de un par sustituto (emoji), se descarta la mitad alta suelta:
	// un sustituto solo hace que encodeURIComponent lance URIError y el pedido no se pueda enviar.
	const ultimo = corte.charCodeAt(corte.length - 1)
	if (ultimo >= 0xD800 && ultimo <= 0xDBFF) {
		corte = corte.slice(0, -1)
	}
	return corte.trimEnd() + '…'
}

function limpio(valor) {
	return typeof valor === 'string' || typeof valor === 'number'
		? String(valor).replace(/\s+/g, ' ').replace(/[*_`~]/g, '').trim() : ''
}

function numero(valor) {
	if ((typeof valor !== 'number' && typeof valor !== 'string') || limpio(valor) === '') {
		return null
	}
	const n = Number(valor)
	return isFinite(n) && n >= 0 ? n : null
}

function lista(valor) {
	return Array.isArray(valor) ? valor.filter(item => item && typeof item === 'object') : []
}

function variante(item) {
	const seleccionada = variante_de_linea(item)
		|| (!(item.pivot && item.pivot.variant_id) ? item.selected_variant : null)
	if (seleccionada) {
		const propiedades = lista(seleccionada.article_property_values).map(propiedad => {
			const tipo = limpio(propiedad.article_property_type && propiedad.article_property_type.name)
			const valor = limpio(propiedad.name)
			return valor ? (tipo ? tipo + ': ' : '') + valor : ''
		}).filter(Boolean)
		if (propiedades.length) {
			return propiedades.join(', ')
		}
		if (limpio(seleccionada.variant_description)) {
			return limpio(seleccionada.variant_description)
		}
	}
	// Un ID conocido no habilita a elegir otra variante del catálogo.
	return item.pivot && limpio(item.pivot.variant_id) ? 'N° ' + limpio(item.pivot.variant_id) : ''
}

function importe(valor, formato) {
	const n = numero(valor)
	return n === null ? 'A confirmar' : limpio(formato.precio(n))
}

function detalle(item, indice, tipo, formato) {
	const pivot = item.pivot || {}
	const cantidad = numero(pivot.amount)
	const unitario = numero(pivot.price)
	// Los precios persistidos prevalecen; nunca se usan precios actuales del catálogo.
	let subtotal = numero(pivot.total)
	if (subtotal === null) {
		subtotal = numero(pivot.subtotal)
	}
	if (subtotal === null && cantidad !== null && unitario !== null) {
		subtotal = numero(cantidad * unitario)
	}
	const lineas = [indice + '. ' + tipo + (acotar(limpio(item.name), TOPES.producto) || 'Sin nombre')
		+ (tiene_marca_consulta_stock(item) ? ' (Consultar)' : '')]
	const descripcion = acotar(variante(item), TOPES.variante)
	if (descripcion) {
		lineas.push('Variante: ' + descripcion)
	}
	lineas.push('Cantidad: ' + (cantidad === null ? 'A confirmar' : cantidad + ' unidades'))
	lineas.push('Precio unitario: ' + importe(pivot.price, formato))
	lineas.push('Subtotal: ' + importe(subtotal, formato))
	return lineas.join('\n')
}

/**
 * Texto sin codificar. Sólo los datos personales que ya enviaba Thanks.
 * Los formateadores pertenecen a la vista; los valores ausentes nunca se formatean como cero.
 */
export function mensaje_pedido_whatsapp(pedido, formato) {
	const order = pedido || {}
	const articulos = lista(order.articles)
	const promos = lista(order.promociones_vinoteca)
	const combos = lista(order.combos)
	const items = articulos.concat(promos, combos)
	const numeroPedido = acotar(limpio(order.num), TOPES.numero)
	const encabezado = '*Pedido' + (numeroPedido ? ' N° ' + numeroPedido : '') + '*'
	const aviso = formato.a_consultar || items.some(tiene_marca_consulta_stock)
		? '_Disponibilidad a confirmar. Pago a coordinar._' : ''
	const total = '*' + (aviso ? 'TOTAL ESTIMADO: ' : 'TOTAL: ') + importe(order.total, formato) + '*'
	const buyer = order.buyer || {}
	const telefono = acotar(limpio(buyer.phone) || limpio(buyer.comercio_city_client && buyer.comercio_city_client.phone), TOPES.telefono)
	const cliente = ['*Cliente:* ' + (acotar(limpio(buyer.name), TOPES.nombre) || 'Cliente')]
	if (telefono) {
		cliente.push('*Teléfono:* ' + telefono)
	}
	const entrega = []
	if (order.deliver === true || order.deliver === 1 || order.deliver === '1') {
		entrega.push('*Entrega:* Envío a domicilio')
		if (limpio(order.address)) {
			entrega.push('*Dirección:* ' + acotar(limpio(order.address), TOPES.direccion))
		}
		if (order.envio_opcion && limpio(formato.texto_envio)) {
			entrega.push(acotar(limpio(formato.texto_envio), TOPES.envio))
		}
		// Forma de envío propia (26/11/2026): sólo si no hay correo; lo arma la vista con lo que se cobró.
		if (!order.envio_opcion && limpio(formato.texto_envio_zona)) {
			entrega.push(acotar(limpio(formato.texto_envio_zona), TOPES.envio))
		}
	} else if (order.deliver === false || order.deliver === 0 || order.deliver === '0') {
		entrega.push('*Entrega:* Retiro por el local')
	}
	if (order.fecha_entrega) {
		entrega.push('*Fecha de entrega:* ' + limpio(formato.fecha(order.fecha_entrega)))
	}
	const lineas_producto = articulos.map((item, i) => detalle(item, i + 1, '', formato))
		.concat(promos.map((item, i) => detalle(item, articulos.length + i + 1, 'Promo: ', formato)))
		.concat(combos.map((item, i) => detalle(item, articulos.length + promos.length + i + 1, 'Combo: ', formato)))
	const observaciones = limpio(order.description)
		? '*Observaciones:* ' + acotar(limpio(order.description), TOPES.observaciones) : ''
	// Bloques fijos: nunca se omiten. Los productos van entre la entrega y el total.
	const antes = [encabezado, aviso, cliente.join('\n'), entrega.join('\n')].filter(Boolean)
	const despues = [total, observaciones].filter(Boolean)
	const armar = function(productos, restantes) {
		const detalle_productos = productos.length ? productos.join('\n\n') : 'Detalle disponible en el pedido.'
		const cola = restantes > 0
			? '\n\n… y ' + restantes + ' productos más (detalle completo en el pedido)' : ''
		return antes.concat(['*Productos*\n' + detalle_productos + cola], despues).join('\n\n')
	}
	let mensaje = armar(lineas_producto, 0)
	if (mensaje.length > MAX_LARGO_MENSAJE) {
		// Se incluyen productos en orden mientras el mensaje (con la línea de restantes) entre en el presupuesto.
		let incluidos = lineas_producto.length
		while (incluidos > 0) {
			incluidos--
			mensaje = armar(lineas_producto.slice(0, incluidos), lineas_producto.length - incluidos)
			if (mensaje.length <= MAX_LARGO_MENSAJE) break
		}
	}
	return mensaje
}
