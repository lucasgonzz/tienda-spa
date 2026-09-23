/*
|--------------------------------------------------------------------------
| SEO (mision seo-tiendas, 23/9/2026)
|--------------------------------------------------------------------------
|
| Helpers compartidos para dos cosas:
|
| 1. Los href reales de los links. Las tarjetas y los menus navegaban solo con $router.push y
|    Google no descubria ni un producto (0 <a href> a fichas en la home). Ahora renderizan un
|    <a :href> con @click.prevent y el click sigue haciendo exactamente lo mismo que antes. El
|    href sale de $router.resolve(), asi que es la misma URL que arma la navegacion.
|
| 2. Las etiquetas de vue-meta de Home.vue y Article.vue (titulo, descripcion, canonica, JSON-LD).
|    Siguen las mismas reglas que tienda-api usa para el HTML del servidor (plan de la mision,
|    "Reglas de ruta" y "Contenido"): la canonica tiene que dar IGUAL en los dos lados.
|
| Se registra como mixin global en main.js (como generals): son solo metodos, sin hooks.
| Los nombres llevan prefijo (seo_ / href_) para no chocar con los de otros mixins.
*/

const SUFIJO_COMPRA = 'Comprá online con envío o retiro en el local.'

export default {
	methods: {
		/**
		 * Origen de la tienda (https://dominio). Mismo "sitio" que seo.php le pasa a la API.
		 * @returns {string}
		 */
		seo_origen() {
			return window.location.origin
		},
		/**
		 * Slug de ruta de un nombre: igual que routeString() (mixins/generals.js) y que
		 * slugRuta() de tienda-api. No saca tildes: la SPA nunca lo hizo.
		 * @param {string} nombre
		 * @returns {string}
		 */
		seo_slug(nombre) {
			return String(nombre || '').toLowerCase().replaceAll(' ', '-')
		},
		/**
		 * Texto plano de un HTML (descripciones cargadas con editor), con los espacios colapsados.
		 * DOMParser y no innerHTML sobre un div: un documento parseado asi no ejecuta scripts ni
		 * dispara la carga de imagenes (un <img onerror> en un div suelto si se ejecuta).
		 * @param {string} html
		 * @returns {string}
		 */
		seo_texto_plano(html) {
			if (!html) {
				return ''
			}
			let texto = String(html)
			try {
				let documento = new DOMParser().parseFromString(texto, 'text/html')
				texto = documento.body ? documento.body.textContent : texto
			} catch (e) {
				texto = texto.replace(/<[^>]*>/g, ' ')
			}
			return String(texto || '').replace(/\s+/g, ' ').trim()
		},
		/**
		 * Corta un texto a 155 caracteres en limite de palabra y le agrega "…" (≤ 160 en total).
		 * Misma regla que la descripcion que arma tienda-api.
		 * @param {string} texto
		 * @returns {string}
		 */
		seo_recortar(texto) {
			texto = String(texto || '')
			if (texto.length <= 160) {
				return texto
			}
			let corte = texto.substring(0, 155)
			let ultimo_espacio = corte.lastIndexOf(' ')
			if (ultimo_espacio > 80) {
				corte = corte.substring(0, ultimo_espacio)
			}
			return corte.replace(/[\s.,;:\-]+$/, '') + '…'
		},
		/**
		 * Texto fijo que cierra las descripciones por defecto.
		 * @returns {string}
		 */
		seo_sufijo_compra() {
			return SUFIJO_COMPRA
		},
		/**
		 * Si el precio de un articulo se le muestra a un visitante ANONIMO (lo que ve Google).
		 *
		 * Es puede_ver_precios() (mixins/generals.js) evaluado sin sesion: con register_to_buy en 0
		 * los precios son publicos; si no, online_price_type 'only_registered' y
		 * 'only_buyers_with_comerciocity_client' los esconden a quien no inicio sesion. Ademas se
		 * descarta el precio pausado (se muestra un texto, no un importe). Sin esto verde, el
		 * JSON-LD Product va sin `offers`: no se filtra un precio que la tienda esconde.
		 *
		 * @param {object} article
		 * @returns {boolean}
		 */
		seo_precio_publico(article) {
			if (!article || !this.commerce || !this.commerce.online_configuration) {
				return false
			}
			let config = this.commerce.online_configuration
			if (Number(config.register_to_buy)) {
				let slug = config.online_price_type ? config.online_price_type.slug : null
				if (slug == 'only_registered' || slug == 'only_buyers_with_comerciocity_client') {
					return false
				}
			}
			if (Number(article.precio_pausado) === 1) {
				return false
			}
			return true
		},
		/**
		 * href de la ficha de un articulo: /articulos/<slug>/<commerce_id>. Mismos params que
		 * toArticle() (mixins/articles.js).
		 * @param {object} article
		 * @returns {string}
		 */
		href_articulo(article) {
			if (!article || !article.slug) {
				return null
			}
			return this.$router.resolve({
				name: 'Article',
				params: { slug: article.slug, commerce_id: process.env.VUE_APP_COMMERCE_ID },
			}).href
		},
		/**
		 * href de una categoria (y opcionalmente de una subcategoria de esa categoria).
		 * @param {object} category
		 * @param {object|null} sub_category
		 * @returns {string}
		 */
		href_categoria(category, sub_category) {
			let params = { category: this.seo_slug(category.name) }
			if (sub_category) {
				params.sub_category = this.seo_slug(sub_category.name)
			}
			return this.$router.resolve({ name: 'Home', params }).href
		},
		/**
		 * href de una marca, bodega o cepa: /inicio/<tipo>/<slug>.
		 * @param {string} tipo 'marca' | 'bodega' | 'cepa'
		 * @param {object} model
		 * @returns {string}
		 */
		href_filtro(tipo, model) {
			return this.$router.resolve({
				name: 'Home',
				params: { category: tipo, sub_category: this.seo_slug(model.name) },
			}).href
		},
		/**
		 * href de la home: '/', que es la canonica de la home para tienda-api (el router la
		 * redirige a /inicio/ultimos-ingresados).
		 * @returns {string}
		 */
		href_home() {
			return '/'
		},
	},
}
