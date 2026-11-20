import { tiene_marca_consulta_stock, variante_de_linea } from './consultas_de_stock'

// Reutiliza los bloques del helper previo; sin columnas ni sangrías Unicode.
export const MAX_LARGO_MENSAJE = 1500

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
	const lineas = [indice + '. ' + tipo + (limpio(item.name) || 'Sin nombre')
		+ (tiene_marca_consulta_stock(item) ? ' (Consultar)' : '')]
	const descripcion = variante(item)
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
	const numeroPedido = limpio(order.num)
	const encabezado = '*Pedido' + (numeroPedido ? ' N° ' + numeroPedido : '') + '*'
	const aviso = formato.a_consultar || items.some(tiene_marca_consulta_stock)
		? '_Disponibilidad a confirmar. Pago a coordinar._' : ''
	const total = '*' + (aviso ? 'TOTAL ESTIMADO: ' : 'TOTAL: ') + importe(order.total, formato) + '*'
	const buyer = order.buyer || {}
	const telefono = limpio(buyer.phone) || limpio(buyer.comercio_city_client && buyer.comercio_city_client.phone)
	const cliente = ['*Cliente:* ' + (limpio(buyer.name) || 'Cliente')]
	if (telefono) {
		cliente.push('*Teléfono:* ' + telefono)
	}
	const entrega = []
	if (order.deliver === true || order.deliver === 1 || order.deliver === '1') {
		entrega.push('*Entrega:* Envío a domicilio')
		if (limpio(order.address)) {
			entrega.push('*Dirección:* ' + limpio(order.address))
		}
		if (order.envio_opcion && limpio(formato.texto_envio)) {
			entrega.push(limpio(formato.texto_envio))
		}
	} else if (order.deliver === false || order.deliver === 0 || order.deliver === '0') {
		entrega.push('*Entrega:* Retiro por el local')
	}
	if (order.fecha_entrega) {
		entrega.push('*Fecha de entrega:* ' + limpio(formato.fecha(order.fecha_entrega)))
	}
	const productos = articulos.map((item, i) => detalle(item, i + 1, '', formato))
		.concat(promos.map((item, i) => detalle(item, articulos.length + i + 1, 'Promo: ', formato)))
		.concat(combos.map((item, i) => detalle(item, articulos.length + promos.length + i + 1, 'Combo: ', formato)))
	const bloques = [encabezado, aviso, cliente.join('\n'), entrega.join('\n'),
		'*Productos*\n' + (productos.length ? productos.join('\n\n') : 'Detalle disponible en el pedido.'),
		total]
	if (limpio(order.description)) {
		bloques.push('*Observaciones:* ' + limpio(order.description))
	}
	let mensaje = bloques.filter(Boolean).join('\n\n')
	if (mensaje.length > MAX_LARGO_MENSAJE) {
		// El resumen conserva total y advertencia, aun con textos de entrada muy extensos.
		mensaje = [encabezado.slice(0, 160).replace(/\*$/, '') + '*', aviso,
			'Pedido de ' + items.length + ' líneas (' + articulos.length + ' productos, '
				+ promos.length + ' promociones, ' + combos.length + ' combos).',
			total, 'El detalle completo está en el pedido registrado.'].filter(Boolean).join('\n\n')
	}
	return mensaje
}
