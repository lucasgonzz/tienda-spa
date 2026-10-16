<template>
	<div class="cat-lista">
		<!--
			Diseño del inicio «Lista de categorías» (online_configuration.diseno_home ==
			'lista_categorias', mision inicio-todas-las-categorias, 16/10/2026, pedido de Los Peña):
			la portada muestra todas las categorias en renglones y cada una se despliega ahi mismo
			con sus productos -- la funcion de su tienda anterior (tiendachat), dibujada con las
			tarjetas de esta tienda. Reemplaza en la portada a Destacados, Novedades y Ultimos
			ingresos (Home.vue decide cuando se muestra).
		-->
		<div class="cat-lista__cabecera">
			<h2 class="cat-lista__titulo">
				Categorías
				<span class="cat-lista__total">{{ categories.length }}</span>
			</h2>
			<label
			v-if="categories.length > 8"
			class="cat-lista__buscador">
				<i class="bi bi-search"></i>
				<input
				v-model="filtro"
				type="search"
				placeholder="Buscar categoría"
				aria-label="Buscar categoría">
			</label>
		</div>

		<ul
		v-if="cargando_categorias"
		class="cat-lista__items">
			<li
			v-for="i in 8"
			:key="i"
			class="cat-lista__item cat-lista__fila">
				<b-skeleton width="40%"></b-skeleton>
			</li>
		</ul>

		<ul
		v-else
		class="cat-lista__items">
			<li
			v-for="category in categorias_filtradas"
			:key="category.id"
			:id="'cat-lista-' + category.id"
			class="cat-lista__item"
			:class="{ 'cat-lista__item--abierta': abierta_id == category.id }">
				<!--
					<a> real a la categoria (mismo criterio que Card.vue, mision seo-tiendas): los
					buscadores siguen el href; el clic despliega en lugar de navegar.
				-->
				<a
				class="cat-lista__fila seo-link"
				:href="href_categoria(category)"
				:aria-expanded="abierta_id == category.id ? 'true' : 'false'"
				@click.prevent="alternar(category)">
					<span
					v-if="hay_imagenes"
					class="cat-lista__avatar">
						<img
						v-if="imagen_de(category)"
						:src="imagen_de(category)"
						:alt="category.name">
						<span
						v-else
						class="cat-lista__inicial">
							{{ inicial_de(category) }}
						</span>
					</span>
					<span class="cat-lista__nombre">
						{{ category.name | first_upper }}
					</span>
					<span
					v-if="cantidad_de(category) !== null"
					class="cat-lista__cantidad">
						{{ cantidad_de(category) }} {{ cantidad_de(category) == 1 ? 'producto' : 'productos' }}
					</span>
					<i class="bi bi-chevron-down cat-lista__chevron"></i>
				</a>

				<div
				v-if="abierta_id == category.id"
				class="cat-lista__panel">
					<div
					v-if="estado_de(category).cargando"
					class="cont-models">
						<article-card-skeleton
						v-for="i in 4"
						:key="i"></article-card-skeleton>
					</div>
					<p
					v-else-if="estado_de(category).error"
					class="cat-lista__aviso">
						No pudimos traer los productos.
						<button
						type="button"
						class="cat-lista__reintentar"
						@click="cargar(category)">
							Reintentar
						</button>
					</p>
					<p
					v-else-if="!estado_de(category).articles.length"
					class="cat-lista__aviso">
						Por ahora no hay productos en esta categoría.
					</p>
					<div
					v-else
					class="cont-models">
						<article-card
						v-for="article in estado_de(category).articles"
						:key="article.id"
						:article="article"></article-card>
					</div>

					<button
					v-if="hay_mas(category)"
					type="button"
					class="cat-lista__ver-todos"
					@click="setSelectedCategory(category)">
						Ver los {{ cantidad_de(category) }} productos de {{ category.name | first_upper }}
						<i class="bi bi-arrow-right"></i>
					</button>
				</div>
			</li>
		</ul>

		<p
		v-if="!cargando_categorias && filtro && !categorias_filtradas.length"
		class="cat-lista__aviso">
			No hay categorías que coincidan con «{{ filtro }}».
		</p>
	</div>
</template>
<script>
import categories from '@/mixins/_categories'
import ArticleCard from '@/components/common/article-card/Index'
import ArticleCardSkeleton from '@/components/common/ArticleCardSkeleton'
import { env } from '@/runtime_config'

export default {
	name: 'ListaCategorias',
	mixins: [categories],
	components: {
		ArticleCard,
		ArticleCardSkeleton,
	},
	props: {
		/**
		 * Categorias publicadas del comercio con productos, tal como llegan de
		 * HomeController::categories() (Home.vue ya saca las vacias).
		 */
		categories: {
			type: Array,
			required: true,
		},
	},
	data() {
		return {
			filtro: '',
			abierta_id: null,
			/**
			 * Productos ya traidos, por id de categoria: { cargando, error, articles, total }.
			 * Se guardan para que volver a abrir una categoria no repita el pedido.
			 */
			por_categoria: {},
		}
	},
	computed: {
		/**
		 * Categorias que coinciden con lo escrito en el buscador, sin importar mayusculas ni tildes.
		 * @returns {Array}
		 */
		categorias_filtradas() {
			let buscado = this.normalizar(this.filtro)
			if (!buscado) {
				return this.categories
			}
			return this.categories.filter(category => this.normalizar(category.name).indexOf(buscado) != -1)
		},
		order_by() {
			return this.$store.state.categories.order_by
		},
		/**
		 * App.vue pide las categorias al arrancar: mientras tanto, renglones esqueleto.
		 * @returns {boolean}
		 */
		cargando_categorias() {
			return !!this.$store.state.categories.loading_categories && !this.categories.length
		},
		/**
		 * La columna de miniaturas aparece solo si al menos una categoria tiene imagen: sin
		 * ninguna, una fila de iniciales repetidas (A, B, B, B...) es ruido y no ayuda a buscar.
		 * @returns {boolean}
		 */
		hay_imagenes() {
			return this.categories.some(category => !!category.image_url)
		},
	},
	methods: {
		/**
		 * Abre la categoria (cerrando la que estuviera abierta) o la cierra si ya estaba abierta.
		 * @param {object} category
		 */
		alternar(category) {
			if (this.abierta_id == category.id) {
				this.abierta_id = null
				return
			}
			this.abierta_id = category.id
			if (!this.por_categoria[category.id] || this.por_categoria[category.id].error) {
				this.cargar(category)
			}
			this.$nextTick(() => {
				this.asomar(category)
			})
		},
		/**
		 * Primera pagina de productos de la categoria: el mismo endpoint que usa el listado
		 * (store/categories.js::getArticles), con el orden elegido.
		 * @param {object} category
		 */
		cargar(category) {
			this.$set(this.por_categoria, category.id, { cargando: true, error: false, articles: [], total: null })
			let url = 'articles/from-category/' + category.id + '/0/0/0/' + this.order_by + '/' + env('VUE_APP_COMMERCE_ID') + '?page=1'
			this.$api.get(url)
			.then(res => {
				this.$set(this.por_categoria, category.id, {
					cargando: false,
					error: false,
					articles: res.data.articles.data,
					total: res.data.articles.total,
				})
			})
			.catch(err => {
				console.log(err)
				this.$set(this.por_categoria, category.id, { cargando: false, error: true, articles: [], total: null })
			})
		},
		/**
		 * Si el renglon que se acaba de abrir quedo tapado por el nav fijo (porque se cerro otro
		 * mas arriba y la pagina se acorto), lo trae a la vista. Si ya se ve, no mueve nada.
		 * @param {object} category
		 */
		asomar(category) {
			let item = document.getElementById('cat-lista-' + category.id)
			let nav = document.querySelector('.cont-nav')
			if (!item) {
				return
			}
			let alto_nav = nav ? nav.getBoundingClientRect().height : 0
			let top = item.getBoundingClientRect().top
			if (top < alto_nav + 8 || top > window.innerHeight * 0.6) {
				window.scrollTo({
					top: top + window.scrollY - alto_nav - 12,
					behavior: 'smooth',
				})
			}
		},
		/**
		 * @param {object} category
		 * @returns {{cargando: boolean, error: boolean, articles: Array, total: (number|null)}}
		 */
		estado_de(category) {
			return this.por_categoria[category.id] || { cargando: true, error: false, articles: [], total: null }
		},
		/**
		 * Cantidad de productos de la categoria: la que trae el listado de categorias
		 * (articles_count) o, si no vino, la del paginado ya traido.
		 * @param {object} category
		 * @returns {number|null}
		 */
		cantidad_de(category) {
			if (category.articles_count !== undefined && category.articles_count !== null) {
				return Number(category.articles_count)
			}
			let estado = this.por_categoria[category.id]
			return estado && estado.total !== null ? Number(estado.total) : null
		},
		/**
		 * Hay mas productos que los que entran en la primera pagina desplegada.
		 * @param {object} category
		 * @returns {boolean}
		 */
		hay_mas(category) {
			let estado = this.estado_de(category)
			let cantidad = this.cantidad_de(category)
			return !estado.cargando && !estado.error && cantidad !== null && cantidad > estado.articles.length
		},
		/**
		 * Imagen de la categoria, resuelta igual que Card.vue (http directa, Cloudinary o storage).
		 * @param {object} category
		 * @returns {string|null}
		 */
		imagen_de(category) {
			let raw = category.image_url
			if (!raw) {
				return null
			}
			if (raw.indexOf('http') === 0) {
				return raw
			}
			if (this.from_cloudinary) {
				return 'https://res.cloudinary.com/lucas-cn/image/upload/q_auto,f_auto/' + raw
			}
			if (raw.indexOf('storage') !== -1) {
				return this.getProductionUrl(raw)
			}
			return raw
		},
		/**
		 * @param {object} category
		 * @returns {string}
		 */
		inicial_de(category) {
			return String(category.name || '?').trim().charAt(0).toUpperCase()
		},
		/**
		 * @param {string} texto
		 * @returns {string}
		 */
		normalizar(texto) {
			return String(texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
		},
	},
}
</script>
<style lang="sass" scoped>
@import '@/sass/_custom'
.cat-lista
	max-width: 960px
	margin: 0 auto
	// La tienda centra todo el texto desde arriba (container de App.vue): una lista se lee a la izquierda.
	text-align: left
	&__cabecera
		display: flex
		align-items: center
		justify-content: space-between
		gap: 12px
		flex-wrap: wrap
		margin-bottom: 14px
	&__titulo
		font-size: 1.35rem
		font-weight: 700
		letter-spacing: -0.01em
		color: rgba(0, 0, 0, 0.85)
		margin: 0
		display: flex
		align-items: center
		gap: 8px
	&__total
		font-size: 0.8rem
		font-weight: 600
		color: $blue
		background: color-mix(in srgb, $blue 12%, #fff)
		border-radius: 999px
		padding: 2px 10px
	&__buscador
		display: flex
		align-items: center
		gap: 8px
		height: 42px
		margin: 0
		padding: 0 14px
		width: 280px
		max-width: 100%
		background: #fff
		border: 1px solid rgba(0, 0, 0, 0.12)
		border-radius: 10px
		color: rgba(0, 0, 0, 0.45)
		transition: border-color 0.2s ease, box-shadow 0.2s ease
		&:focus-within
			border-color: $blue
			box-shadow: 0 0 0 3px color-mix(in srgb, $blue 18%, transparent)
		// Las reglas globales de input de la tienda le ponen sombra (con !important, _form.sass), padding
		// y alto propios: aca el borde y el foco los dibuja el label que lo envuelve.
		input
			-webkit-appearance: none
			border: 0
			border-radius: 0
			box-shadow: none !important
			padding: 0
			height: auto
			outline: 0
			background: transparent
			width: 100%
			font-size: 0.95rem
			color: rgba(0, 0, 0, 0.85)
		@media screen and (max-width: 576px)
			width: 100%
	&__items
		list-style: none
		margin: 0
		padding: 0
		background: #fff
		border: 1px solid rgba(0, 0, 0, 0.06)
		border-radius: 16px
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.05)
		overflow: clip
	&__item
		& + &
			border-top: 1px solid rgba(0, 0, 0, 0.06)
		&--abierta
			background: color-mix(in srgb, $blue 4%, #fff)
			.cat-lista__chevron
				transform: rotate(180deg)
				color: $blue
			.cat-lista__nombre
				color: $blue
	// width explicito: las reglas globales .tarjetas-escritorio-N / -notebook-N le ponen ancho
	// en porcentaje a TODO <a> de la tienda (_cont_cards_escritorio.sass).
	&__fila
		display: flex
		align-items: center
		gap: 14px
		width: 100%
		min-height: 60px
		padding: 10px 18px
		box-sizing: border-box
		color: inherit
		text-decoration: none
		cursor: pointer
		transition: background 0.15s ease
		&:hover
			background: rgba(0, 0, 0, 0.025)
			text-decoration: none
		&:focus-visible
			outline: 2px solid $blue
			outline-offset: -2px
		@media screen and (max-width: 576px)
			padding: 10px 14px
			gap: 12px
	&__avatar
		flex: 0 0 auto
		width: 40px
		height: 40px
		border-radius: 10px
		overflow: hidden
		display: flex
		align-items: center
		justify-content: center
		background: color-mix(in srgb, $blue 12%, #fff)
		img
			width: 100%
			height: 100%
			object-fit: cover
	&__inicial
		font-weight: 700
		font-size: 1rem
		color: $blue
	&__nombre
		flex: 1 1 auto
		min-width: 0
		font-weight: 600
		font-size: 1rem
		color: rgba(0, 0, 0, 0.85)
		overflow: hidden
		text-overflow: ellipsis
		white-space: nowrap
		transition: color 0.2s ease
	&__cantidad
		flex: 0 0 auto
		font-size: 0.85rem
		color: rgba(0, 0, 0, 0.5)
		@media screen and (max-width: 576px)
			font-size: 0.78rem
	&__chevron
		flex: 0 0 auto
		font-size: 0.95rem
		color: rgba(0, 0, 0, 0.4)
		transition: transform 0.25s ease, color 0.2s ease
	&__panel
		padding: 6px 12px 18px
		@media screen and (max-width: 576px)
			padding: 4px 6px 14px
	&__ver-todos
		display: flex
		align-items: center
		justify-content: center
		gap: 8px
		margin: 4px auto 0
		height: 42px
		padding: 0 20px
		border: 1px solid $blue
		border-radius: 10px
		background: #fff
		color: $blue
		font-weight: 600
		font-size: 0.95rem
		transition: background 0.2s ease, color 0.2s ease
		&:hover
			background: $blue
			color: #fff
		@media screen and (max-width: 576px)
			width: 100%
			font-size: 0.9rem
	&__aviso
		text-align: center
		color: rgba(0, 0, 0, 0.55)
		margin: 18px 0
	&__reintentar
		border: 0
		background: transparent
		color: $blue
		font-weight: 600
		text-decoration: underline
</style>
