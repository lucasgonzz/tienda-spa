<template>
	<div
	class="categoria-home-card c-p"
	role="button"
	tabindex="0"
	@click="on_card_click"
	@keyup.enter="on_card_click">
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
	</div>
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
.categoria-home-card
	display: flex
	flex-direction: column
	align-items: center
	text-align: center
	background: #fff
	border-radius: 10px
	padding: 1rem
	cursor: pointer
	transition: box-shadow 0.25s ease, transform 0.15s ease
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1)
	&:hover
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.14)
		transform: translateY(-2px)
	&:focus
		outline: 2px solid $blue
		outline-offset: 2px
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
	&__name
		font-weight: bold
		text-transform: uppercase
		font-size: 0.95rem
		color: #222
		margin: 0
	&__description
		font-size: 0.85rem
		color: #666
		margin: 0.35rem 0 0
</style>
