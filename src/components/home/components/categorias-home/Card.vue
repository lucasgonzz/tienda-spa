<template>
	<!--
		<a> real a la categoria (mision seo-tiendas) en lugar de un div con role=button: los
		buscadores siguen el href y el click hace lo mismo que antes. Un link ya es enfocable y
		dispara click con Enter, por eso se van tabindex y @keyup.enter (si no, Enter navegaria
		dos veces).
	-->
	<a
	class="categoria-home-card c-p seo-link"
	:class="{ 'categoria-home-card--active': active }"
	:href="href_categoria(item)"
	:aria-current="active ? 'true' : null"
	@click.prevent="on_card_click">
		<div class="categoria-home-card__image-wrap">
			<img
			v-if="resolved_image_url"
			:src="resolved_image_url"
			:alt="item.name"
			class="categoria-home-card__image">
			<div
			v-else
			class="categoria-home-card__image categoria-home-card__image--placeholder">
				<i class="bi bi-grid"></i>
			</div>
		</div>
		<p class="categoria-home-card__name">
			{{ item.name | first_upper }}
		</p>
		<p
		v-if="item.descripcion"
		class="categoria-home-card__description">
			{{ item.descripcion }}
		</p>
	</a>
</template>
<script>
/**
 * Tarjeta de categoria de la seccion "categorias en el Home" (mision
 * catalogo-categorias-home, 18/9/2026). Presentacional: no conoce el mecanismo de
 * filtrado, solo emite 'select' hacia el orquestador (Index.vue) -- mismo patron
 * que components/catalogo/Category.vue, que hace lo mismo para /catalogo.
 */
export default {
	name: 'CategoriaHomeCard',
	props: {
		/**
		 * Categoria tal como llega de HomeController::categories() en tienda-api:
		 * { id, name, image_url, descripcion, sub_categories, articles_count, ... }.
		 */
		item: {
			type: Object,
			required: true,
		},
		/**
		 * true si esta es la categoria seleccionada ($store.state.categories.selected_category),
		 * lo decide el orquestador (Index.vue) -- esta tarjeta no lee el store.
		 */
		active: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		/**
		 * URL de imagen resuelta (http directa, Cloudinary o storage). Misma logica
		 * que resolve_tile_image_url() de components/catalogo/Category.vue, duplicada
		 * a proposito: no hay mixin compartido para esto en la base, cada tile
		 * resuelve la suya.
		 * @returns {string|null}
		 */
		resolved_image_url() {
			return this.resolve_image_url(this.item.image_url)
		},
	},
	methods: {
		/**
		 * Resuelve URL de imagen (hosting o Cloudinary).
		 * @param {string|null} raw
		 * @returns {string|null}
		 */
		resolve_image_url(raw) {
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
		 * Notifica al padre (Index.vue) para que aplique la navegacion: el mecanismo
		 * en si vive en el mixin _categories y nunca se reimplementa aca.
		 */
		on_card_click() {
			this.$emit('select', this.item)
		},
	},
}
</script>
<style lang="sass" scoped>
@import '@/sass/_custom'
// Radio y sombra en dos capas, mismo lenguaje que _plantilla_comerciocity.sass (.article-card),
// pero declarados acá sueltos: esta seccion la ve un comercio con cualquiera de las tres
// plantillas (Moderno, Clasico o ComercioCity), no solo el que activo esa ultima.
.categoria-home-card
	position: relative
	display: flex
	flex-direction: column
	align-items: center
	text-align: center
	background: #fff
	border: 1px solid rgba(0, 0, 0, 0.06)
	border-radius: 16px
	padding: 1.1rem 1rem
	box-sizing: border-box
	cursor: pointer
	// El ancho de columna lo define esta tarjeta (no el grid del padre, ver Index.vue): 2 por
	// fila en telefono, 3 en tablet, 4 en escritorio -- mismos cortes que la grilla anterior.
	// La formula resta la porcion de gap (1rem) que le toca a cada tarjeta de la fila:
	// calc((100% - (n-1)*gap) / n).
	flex: 0 1 calc(50% - 0.5rem)
	min-width: 140px
	@media screen and (min-width: 768px)
		flex-basis: calc(33.333% - 0.667rem)
	@media screen and (min-width: 1200px)
		flex-basis: calc(25% - 0.75rem)
	transition: box-shadow 0.25s ease, transform 0.15s ease, border-color 0.2s ease, background 0.2s ease
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.05)
	&:hover
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06), 0 12px 32px rgba(0, 0, 0, 0.10)
		transform: translateY(-3px)
	&:focus
		outline: 2px solid $blue
		outline-offset: 2px
	// Estado activo: la categoria en la que esta parado el visitante ($store.state.categories.selected_category).
	// El anillo va por box-shadow (no border) para no mover el layout 1px al prender/apagar,
	// mismo criterio que .selected-image en _plantilla_comerciocity.sass.
	&--active
		border-color: transparent
		background: color-mix(in srgb, $blue 6%, #fff)
		box-shadow: 0 0 0 2px $blue, 0 4px 16px rgba(0, 0, 0, 0.08)
		&:hover
			box-shadow: 0 0 0 2px $blue, 0 12px 32px rgba(0, 0, 0, 0.10)
		.categoria-home-card__name
			color: $blue
	&__image-wrap
		width: 100%
		display: flex
		align-items: center
		justify-content: center
		margin-bottom: 0.75rem
	&__image
		width: 100%
		max-height: 130px
		object-fit: contain
		&--placeholder
			height: 130px
			background: #f4f4f4
			border-radius: 8px
			display: flex
			align-items: center
			justify-content: center
			font-size: 2rem
			color: #bbb
	// Antes bold + mayusculas: un trato mas pesado que el resto del sistema (el mismo nombre de
	// categoria, en el sidebar, usa font-weight 600 sin mayusculas forzadas -- nav/categories/Index.vue,
	// .nav-categories__name). Se empareja el peso, no se inventa uno nuevo.
	&__name
		font-weight: 600
		letter-spacing: -0.01em
		font-size: 0.95rem
		color: rgba(0, 0, 0, 0.85)
		margin: 0
		transition: color 0.2s ease
	&__description
		font-size: 0.85rem
		color: rgba(0, 0, 0, 0.55)
		margin: 0.35rem 0 0
</style>
