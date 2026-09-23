<template>
	<div
	v-if="data_seted || articulo_no_encontrado"
	class="article-page view">
		<div
		v-if="articulo_no_encontrado"
		class="payment-result">
			<div class="payment-result__card">
				<i class="bi bi-exclamation-triangle-fill payment-result__icon payment-result__icon--error"></i>

				<h1 class="payment-result__title">
					No pudimos cargar este producto
				</h1>
				<p class="payment-result__text">
					Puede que ya no esté disponible, o que se haya cortado la conexión un instante.
				</p>

				<div class="payment-result__actions">
					<b-button
					block
					variant="success"
					@click="getArticleToShowBySlug">
						Reintentar
					</b-button>
					<b-button
					block
					variant="outline-secondary"
					:to="{name: 'Home'}">
						Volver a la tienda
					</b-button>
				</div>
			</div>
		</div>

		<!--
			🔴 El v-else es de `bd24352` y NO se toca: sin el, cuando el fetch no trae articulo
			la ficha se dibujaba igual y quedaba en blanco. Todo lo de esta mision va ADENTRO.
		-->
		<template v-else>
			<add-to-cart-modal></add-to-cart-modal>

			<advise></advise>

			<div class="article-page__main">
				<article-view></article-view>
			</div>

			<!--
				La descripcion completa, fuera de la tarjeta blanca. El id es el ancla a la que
				scrollea el "Ver caracteristicas" de "Lo que tenes que saber de este producto":
				si se cambia, hay que cambiarlo tambien en `data/SaberDelProducto.vue`.
			-->
			<section
			v-if="tiene_descripcion"
			id="descripcion-completa"
			class="article-page__section article-page__section--descripcion">
				<description></description>
			</section>

			<!--
				Las dos secciones de recomendacion, cada una en su propio bloque. Sin datos no
				se dibuja nada, ni el titulo: el componente tiene el v-if adentro, por eso no
				van envueltas en un <section> propio (quedaria un bloque vacio con su linea).

				La seccion suelta de "Tambien te puede interesar" se fue: esos mismos articulos
				ahora viven ADENTRO de la tarjeta blanca, como relacionados.
			-->
			<tambien-compraron
			titulo="Quienes vieron este producto también compraron"
			:articulos="tambien_compraron_vistas"></tambien-compraron>

			<tambien-compraron
			titulo="Quienes compraron este producto también compraron"
			:articulos="tambien_compraron_compras"></tambien-compraron>

			<section class="article-page__section article-page__section--contact">
				<contact-info></contact-info>
			</section>
		</template>
	</div>
</template>

<script>
import Advise from '@/components/article/modals/Advise'

import CanSeePrices from '@/components/home/components/CanSeePrices'
import CategoryInfo from '@/components/article/components/CategoryInfo'
import ArticleImage from '@/components/article/components/ArticleImage'
import ArticleData from '@/components/article/components/data/Index'
import Variants from '@/components/article/components/data/Variants'
import Description from '@/components/article/components/Description'
import Questions from '@/components/article/components/questions/Index'
import Preguntar from '@/components/article/components/Preguntar'
import Categories from '@/components/categories/components/Categories'
import Platelets from '@/components/home/components/platelets/Index'
import articles from '@/mixins/articles'
import { tiene_descripcion as tiene_descripcion_del_articulo } from '@/helpers/descripcion_articulo'
import { abrir_vista_de_producto, cerrar_vista } from '@/utils/tracking'
import { seo_servidor } from '@/utils/seo_servidor'

/**
 * Vista detalle de artículo: layout envuelto para alinearlo con el resto de páginas retail de la tienda.
 */
export default {
	name: 'Article',
	mixins: [articles],
	/**
	 * Head de la ficha (mision seo-tiendas), con las mismas reglas que tienda-api usa para el HTML
	 * del servidor: titulo "<nombre>[ - <bodega>]" (App.vue le agrega " | <comercio>"),
	 * descripcion en texto plano de hasta 160 caracteres, canonica /articulos/<slug>/<commerce_id>,
	 * Open Graph de producto y JSON-LD Product. Todo con vmid para que vue-meta no duplique.
	 */
	metaInfo() {
		if (!this.article) {
			if (this.articulo_no_encontrado) {
				return {
					meta: [{ vmid: 'robots', name: 'robots', content: 'noindex,follow' }],
					link: [],
				}
			}
			return {}
		}
		let comercio = this.commerce.company_name
		let titulo_completo = comercio ? this.title + ' | ' + comercio : this.title
		let imagen = this.seo_imagen
		let meta = [
			{ vmid: 'description', name: 'description', content: this.description },
			{ vmid: 'og:type', property: 'og:type', content: 'product' },
			{ vmid: 'og:title', property: 'og:title', content: titulo_completo },
			{ vmid: 'og:description', property: 'og:description', content: this.description },
			{ vmid: 'og:url', property: 'og:url', content: this.seo_canonica },
			{ vmid: 'twitter:card', name: 'twitter:card', content: imagen ? 'summary_large_image' : 'summary' },
		]
		if (imagen) {
			meta.push({ vmid: 'og:image', property: 'og:image', content: imagen })
		}
		return {
			title: this.title,
			meta,
			link: [
				{ vmid: 'canonical', rel: 'canonical', href: this.seo_canonica },
			],
			// Si el visitante entro directo a esta ficha, el Product (con sus migas) ya lo trajo el
			// servidor: no se duplica (ver src/utils/seo_servidor.js).
			script: seo_servidor.ld_del_servidor ? [] : [
				{ vmid: 'ld-product', type: 'application/ld+json', json: this.seo_json_ld },
			],
		}
	},
	components: {
		Advise,

		CanSeePrices,
		CategoryInfo,
		ArticleImage,
		ArticleData,
		Variants,
		Description,
		Questions,
		Preguntar,
		Categories,
		Platelets,

		ArticleView: () => import('@/components/article/components/article-view/Index'),
		ContactInfo: () => import('@/components/common/ContactInfo'),
		AddToCartModal: () => import('@/components/common/add-to-cart-modal/Index'),
		TambienCompraron: () => import('@/components/article/components/TambienCompraron'),
	},
	data() {
		return {
			loading: false,
			data_seted: false,
			articulo_no_encontrado: false,
		}
	},
	computed: {
		article() {
			return this.$store.state.articles.article_to_show
		},
		/**
		 * Si hay algo que mostrar en la descripcion completa. Mismo criterio que el "show"
		 * de `Description.vue`, que es lo que dibuja adentro (los dos leen de
		 * `helpers/descripcion_articulo.js`): la seccion se armaba igual sin esto -sin v-if
		 * propio- y un articulo sin descripcion dejaba una raya horizontal y aire en blanco
		 * antes del contacto.
		 *
		 * @returns {boolean}
		 */
		tiene_descripcion() {
			return tiene_descripcion_del_articulo(this.article)
		},
		title() {
			if (this.article) {
				let title = this.article.name
				if (this.article.bodega) {
					title += ' - ' + this.article.bodega.name
				}
				return title
			}
			return ''
		},
		/**
		 * Descripcion para buscadores: la del articulo en texto plano, cortada a 160 en palabra.
		 * Si no tiene, "<nombre> en <comercio>[, a <precio>]. Comprá online con envío o retiro en
		 * el local." — el precio solo si es publico para un visitante sin sesion
		 * (seo_precio_publico, mixins/seo.js). Antes salia siempre `article.price` crudo, aunque
		 * la tienda escondiera los precios.
		 *
		 * @returns {string}
		 */
		description() {
			if (!this.article) {
				return ''
			}
			/*
			 * 🔴 MISMA regla, en el mismo orden, que `fichaDeArticulo()` de tienda-api (el HTML que
			 * le llega a Google): (1) titulo + contenido de TODAS las descripciones con titulo;
			 * (2) si eso no da texto, el campo "Descripcion" del articulo (`descripcion`, en
			 * español: `description` no existe en ninguna base y por eso el respaldo no andaba);
			 * (3) la generica. Antes tomaba solo el contenido de la primera descripcion, sin
			 * titulo, y el SPA pisaba con vue-meta lo que el servidor habia dicho.
			 */
			let partes = []
			if (Array.isArray(this.article.descriptions)) {
				this.article.descriptions.forEach(descripcion_con_titulo => {
					if (descripcion_con_titulo) {
						partes.push(this.seo_texto_plano(descripcion_con_titulo.title))
						partes.push(this.seo_texto_plano(descripcion_con_titulo.content))
					}
				})
			}
			let texto = partes.filter(parte => parte).join(' ')
			if (!texto) {
				texto = this.seo_texto_plano(this.article.descripcion)
			}
			/*
			 * 🔴 Una PROMOCION (PromocionVinoteca) tambien llega como `article_to_show` cuando el slug
			 * no es de un articulo (ArticleController@show), y su texto vive en `description`, en
			 * ingles. tienda-api ya la usa asi en `fichaDePromocion()`. Un Article real no tiene esa
			 * propiedad, asi que no molesta; sin esto, la promo perdia su descripcion propia.
			 */
			if (!texto) {
				texto = this.seo_texto_plano(this.article.description)
			}
			if (texto) {
				return this.seo_recortar(texto)
			}
			let descripcion = this.article.name + ' en ' + this.commerce.company_name
			let precio = this.seo_precio_numerico
			if (precio !== null) {
				descripcion += ', a ' + this.price(precio)
			}
			return this.seo_recortar(descripcion + '. ' + this.seo_sufijo_compra())
		},
		/**
		 * Canonica de la ficha: misma formula que tienda-api, <origen>/articulos/<slug>/<commerce_id>.
		 * @returns {string}
		 */
		seo_canonica() {
			return this.seo_origen() + '/articulos/' + this.seo_segmento(this.article.slug) + '/' + process.env.VUE_APP_COMMERCE_ID
		},
		/**
		 * Todas las fotos del articulo (la primera es la de og:image). Si no tiene, la imagen por
		 * defecto del comercio, igual que la tarjeta (articleImage, mixins/generals.js).
		 * @returns {Array<string>}
		 */
		seo_imagenes() {
			let imagenes = (this.article.images || []).map(image => image.hosting_url).filter(url => !!url)
			if (!imagenes.length) {
				let por_defecto = this.articleImage(this.article)
				if (por_defecto) {
					imagenes.push(por_defecto)
				}
			}
			return imagenes
		},
		seo_imagen() {
			return this.seo_imagenes.length ? this.seo_imagenes[0] : null
		},
		/**
		 * El precio como numero, SOLO si un visitante anonimo lo ve (seo_precio_publico). null si
		 * no: en ese caso el JSON-LD va sin `offers`, no se filtra un precio que la tienda esconde.
		 * @returns {number|null}
		 */
		seo_precio_numerico() {
			if (this.article.is_promocion_vinoteca || !this.seo_precio_publico(this.article)) {
				return null
			}
			let precio = Number(this.articlePriceEfectivo(this.article, false))
			if (!isFinite(precio) || precio <= 0) {
				return null
			}
			return precio
		},
		/**
		 * JSON-LD Product. Los textos van sin < ni >: vue-meta mete el JSON como innerHTML del
		 * script y un cierre de script dentro de un nombre lo cortaria.
		 * @returns {object}
		 */
		seo_json_ld() {
			let limpiar = valor => String(valor === null || valor === undefined ? '' : valor).replace(/[<>]/g, '')
			let producto = {
				'@context': 'https://schema.org',
				'@type': 'Product',
				name: limpiar(this.article.name),
				url: this.seo_canonica,
			}
			if (this.seo_imagenes.length) {
				producto.image = this.seo_imagenes
			}
			if (this.description) {
				producto.description = limpiar(this.description)
			}
			if (this.article.bar_code) {
				producto.sku = limpiar(this.article.bar_code)
			}
			if (this.article.brand && this.article.brand.name) {
				producto.brand = { '@type': 'Brand', name: limpiar(this.article.brand.name) }
			}
			if (this.seo_precio_numerico !== null) {
				producto.offers = {
					'@type': 'Offer',
					price: this.seo_precio_numerico,
					priceCurrency: 'ARS',
					availability: this.hasStock(this.article) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
					url: this.seo_canonica,
				}
			}
			return producto
		},
		/**
		 * "Quienes vieron este producto también compraron". Vacio = seccion oculta.
		 *
		 * @returns {Array}
		 */
		tambien_compraron_vistas() {
			return this.$store.state.articles.tambien_compraron_vistas
		},
		/**
		 * "Quienes compraron este producto también compraron". Vacio = seccion oculta.
		 *
		 * @returns {Array}
		 */
		tambien_compraron_compras() {
			return this.$store.state.articles.tambien_compraron_compras
		},
	},
	methods: {
		getArticleToShow() {
			if (!this.article) {
				this.getArticleToShowBySlug()
			} else {
				this.setArticleProps()
			}
		},
		getArticleToShowBySlug() {
			this.$store
				.dispatch('articles/getArticleToShow', {
					slug: this.$route.params.slug,
					commerce_id: this.$route.params.commerce_id,
				})
				.then(() => {
					/*
					 * article_to_show puede quedar en null por dos caminos: el fetch falló y el
					 * catch de la action lo absorbió sin relanzar, o el backend respondió 200 con
					 * article: null (slug/commerce_id que no matchean ningún Article ni
					 * PromocionVinoteca). En los dos casos NO hay que llamar a setArticleProps():
					 * getSimilars() y checkCartArticleVariant() asumen un artículo real y tiran
					 * TypeError apenas lo leen, lo que aborta la función ANTES de la línea que pone
					 * data_seted en true -- la pantalla quedaba en blanco para siempre y sin ningún
					 * aviso (informe 20260916-detalle-articulo-recarga).
					 */
					this.articulo_no_encontrado = !this.article
					if (this.article) {
						this.setArticleProps()
					}
				})
		},
		setArticleProps() {
			this.$store.dispatch('articles/getSimilars')
			/*
			 * Las dos secciones de recomendacion. Van acá y no en created() por lo mismo que el
			 * resto: setArticleProps() es el EMBUDO ÚNICO de los dos caminos de carga, y esta
			 * vista se REUSA al ir de un artículo a otro.
			 *
			 * No se encadenan ni se espera la respuesta: las dos son independientes entre sí y
			 * de todo lo demás, y si alguna falla su .catch() deja el array vacío y su sección
			 * no se dibuja.
			 */
			this.$store.dispatch('articles/get_tambien_compraron_vistas')
			this.$store.dispatch('articles/get_tambien_compraron_compras')
			this.checkCartArticle()
			/*
			 * La cantidad que dejó pedida el mensaje de promoción GANA sobre la del carrito:
			 * el comprador acaba de decir "quiero N a este precio". checkCartArticleAmount()
			 * acaba de pisar el amount con lo del carrito (o con ''), así que esto va después
			 * o no se ve. Se consume una sola vez.
			 *
			 * Va acá y no en created() porque setArticleProps() es el EMBUDO ÚNICO de los dos
			 * caminos de carga, y esta vista se REUSA al ir de un artículo a otro (el watcher
			 * de $route llama a getArticleToShowBySlug, que termina acá).
			 */
			let cantidad_promo = this.$store.state.client_offers.cantidad_pendiente
			if (cantidad_promo) {
				this.$store.commit('articles/setAmount', cantidad_promo)
				this.$store.commit('client_offers/set_cantidad_pendiente', null)
			}
			this.data_seted = true
			/*
			 * Arranca el reloj de la vista de producto. Es el único embudo por el que pasan
			 * los dos caminos de carga (created con el artículo ya en el store, y la vuelta
			 * del fetch por slug), así que alcanza con engancharlo acá.
			 */
			abrir_vista_de_producto(this.article)
		},
	},
	created() {
		this.getArticleToShow()
		setTimeout(() => {
			this.$scrollToTop()
		}, 300)
	},
	watch: {
		$route(to, from) {
			/*
			 * Al ir de un artículo a otro este componente se REUSA: beforeRouteLeave no
			 * dispara y este watcher es el único que puede cerrar la vista anterior antes
			 * de que empiece la siguiente. cerrar_vista() es idempotente, así que si además
			 * llega beforeRouteLeave no se duplica el evento.
			 */
			cerrar_vista()
			this.getArticleToShowBySlug()
		},
	},
	beforeRouteLeave(to, from, next) {
		cerrar_vista()
		this.$store.commit('articles/setArticleToShow', null)
		next()
	},
}
</script>

<style lang="scss" scoped>
.article-page {
  font-family: var(--font-family-sans, sans-serif);
  /*
   * Antes 1200px: en una pantalla ancha (≥1600px) dejaba franjas vacías grandes a los costados y,
   * puertas adentro, apretaba la columna de datos del artículo contra la de la imagen. 1400px es
   * el punto medio verificado en los tres anchos: en escritorio "de verdad" (1366-1440) no se
   * siente más ancho de lo necesario, y recién a partir de ahí gana aire.
   */
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  padding-bottom: 2rem;
}

.article-page__main {
  margin-bottom: 0.5rem;
}

.article-page__section {
  margin-top: 2rem;
  padding-top: 1.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.article-page__section--contact {
  padding-bottom: 0.5rem;
  /*
   * Rompe el max-width del padre y ocupa todo el ancho del viewport (carril completo).
   */
  width: 100vw;
  max-width: none;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  box-sizing: border-box;
}

.article-page__section-eyebrow {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--secondary-color);
  margin-bottom: 0.35rem;
  text-align: center;

  @media (min-width: 992px) {
    text-align: left;
    padding-left: 0.25rem;
  }
}

/*
 * La descripción completa del artículo. Es el ancla del botón "Ver características" de
 * "Lo que tenés que saber de este producto", así que el scroll tiene que llegar a una
 * sección que se vea: el margen de arriba lo da .article-page__section.
 */
.article-page__section--descripcion {
  scroll-margin-top: 1rem;
}
</style>
