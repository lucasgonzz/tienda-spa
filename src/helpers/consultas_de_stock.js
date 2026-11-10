export function consultas_de_stock_activas(comercio) {
	return !!comercio && comercio.consultas_de_stock === true
}

export function stock_es_cero(stock) {
	return stock !== null && stock !== undefined && stock !== '' && Number(stock) === 0
}

export function es_articulo_publicado(articulo) {
	return articulo && !articulo.is_combo && !articulo.is_promocion_vinoteca
		&& Number(articulo.online) === 1 && articulo.status === 'active'
}

export function variante_visible(variante) {
	return !!variante && Number(variante.oculta) !== 1
}

export function variante_de_linea(articulo) {
	if (!articulo.pivot || !articulo.pivot.variant_id) {
		return null
	}

	const id = articulo.pivot.variant_id
	return (articulo.article_variants || []).find(variante => variante.id == id)
		|| (articulo.selected_variant && articulo.selected_variant.id == id ? articulo.selected_variant : null)
}

export function tiene_marca_consulta_stock(articulo) {
	return !!(articulo.pivot && Number(articulo.pivot.stock_a_consultar) === 1)
}

export function linea_a_consultar(articulo, comercio) {
	if (!consultas_de_stock_activas(comercio)) {
		return false
	}
	// La marca que devuelve el servidor prevalece sobre el stock del catálogo.
	if (articulo.pivot && articulo.pivot.stock_a_consultar !== undefined) {
		return tiene_marca_consulta_stock(articulo)
	}
	if (!es_articulo_publicado(articulo)) {
		return false
	}

	const variante = variante_de_linea(articulo)
	if ((articulo.article_variants || []).length || (articulo.pivot && articulo.pivot.variant_id)) {
		return variante_visible(variante) && stock_es_cero(variante.stock)
	}
	return stock_es_cero(articulo.stock)
}

export function carrito_a_consultar(carrito, comercio) {
	return !!carrito && (carrito.articles || []).some(articulo => linea_a_consultar(articulo, comercio))
}
