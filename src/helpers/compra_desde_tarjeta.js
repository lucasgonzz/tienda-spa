import { variante_visible } from '@/helpers/consultas_de_stock'

// La API actual no publica mínimos ni pasos por artículo: la unidad es entera.
// La cantidad predeterminada es una preferencia, nunca un mínimo inventado.
export function cantidad_inicial(config) {
	const valor = Number(config.default_amount_add_to_cart)
	return Number.isFinite(valor) && valor > 0 && Number.isInteger(valor) ? valor : null
}

export function requiere_selector(article, config) {
	return !!((article.article_variants || []).length
		|| (article.article_properties || []).length || cantidad_inicial(config) === null)
}

export function error_compra({ article, amount, variante, config, consultar, precio, pausado }) {
	if (pausado || !Number.isFinite(Number(precio)) || Number(precio) <= 0) return 'Este artículo no tiene un precio disponible'
	const cantidad = Number(amount)
	if (!Number.isFinite(cantidad) || !Number.isInteger(cantidad) || cantidad <= 0) return 'Indicá una cantidad entera positiva'
	if ((article.article_variants || []).length) {
		if (!variante || !(article.article_variants || []).some(v => v.id == variante.id) || !variante_visible(variante)) return 'Elegí una variante para continuar'
	}
	const stock = variante ? variante.stock : article.stock
	if (!config.ignorar_stock && !consultar) {
		if (stock == null && Number(config.stock_null_equal_0) === 1) return 'Sin stock disponible'
		if (stock != null && (!Number.isFinite(Number(stock)) || cantidad > Number(stock))) return 'La cantidad supera el stock disponible'
	}
	return null
}

// Sólo un selector por store: los controles heredados comparten la selección Vuex.
const compras_activas = new WeakSet()
export function tomar_compra(store) {
	if (compras_activas.has(store)) return false
	compras_activas.add(store)
	return true
}
export function soltar_compra(store) { compras_activas.delete(store) }
