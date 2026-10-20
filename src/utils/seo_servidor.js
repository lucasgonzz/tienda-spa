/*
|--------------------------------------------------------------------------
| Etiquetas SEO que vienen del servidor (mision seo-tiendas, 23/9/2026)
|--------------------------------------------------------------------------
|
| public/seo.php mete en el <head> las etiquetas de la pagina pedida, todas con data-seo:
| titulo, descripcion, canonica, Open Graph y los JSON-LD (Store, WebSite, BreadcrumbList,
| ItemList, Product) que arma tienda-api.
|
| vue-meta solo administra las etiquetas que creo el, asi que las del servidor hay que sacarlas
| a mano o la pagina queda con dos descripciones y dos canonicas. Pero NO todas a la vez:
|
| - titulo, descripcion, canonica y Open Graph se sacan antes de montar: vue-meta los vuelve a
|   poner con los mismos valores (App.vue, Home.vue, Article.vue).
| - los JSON-LD se QUEDAN mientras el visitante siga en la URL con la que entro. La SPA solo
|   sabe armar el Product de la ficha; si se sacaran al montar, Google (que indexa lo que queda
|   despues del JS) perderia el Store de la home, las migas y los ItemList de las categorias.
|   Se sacan en la primera navegacion interna, cuando ya describen otra pagina.
|
| Mientras esten, la ficha no agrega su propio Product (serian dos Product para la misma URL):
| lo mira por ld_del_servidor, que es reactivo para que el metaInfo de Article.vue se recalcule.
*/
import Vue from 'vue'

// Estado compartido: true mientras sigan en el head los JSON-LD que mando el servidor.
export const seo_servidor = Vue.observable({
	ld_del_servidor: false,
})

const SELECTOR_LD = 'script[type="application/ld+json"]'

/**
 * Saca del head las etiquetas del servidor que vue-meta va a reponer, y deja los JSON-LD.
 * Se llama una vez, justo antes de montar la app.
 * @returns {void}
 */
export function limpiar_head_del_servidor() {
	let etiquetas = document.head.querySelectorAll('[data-seo]')
	let quedan_ld = false
	for (let i = 0; i < etiquetas.length; i++) {
		if (etiquetas[i].matches(SELECTOR_LD)) {
			quedan_ld = true
			continue
		}
		etiquetas[i].parentNode.removeChild(etiquetas[i])
	}
	seo_servidor.ld_del_servidor = quedan_ld
}

/**
 * Saca los JSON-LD del servidor que hayan quedado. Se llama en la primera navegacion interna.
 * @returns {void}
 */
export function soltar_ld_del_servidor() {
	if (!seo_servidor.ld_del_servidor) {
		return
	}
	let scripts = document.head.querySelectorAll(SELECTOR_LD + '[data-seo]')
	for (let i = 0; i < scripts.length; i++) {
		scripts[i].parentNode.removeChild(scripts[i])
	}
	seo_servidor.ld_del_servidor = false
}
