<template>
	<div
	class="category-catalog-tile c-p"
	:style="tile_background_style"
	role="button"
	tabindex="0"
	@click="on_tile_click"
	@keyup.enter="on_tile_click">
		<div
		class="category-catalog-tile__label">
			<span
			class="category-catalog-tile__title">
				{{ item.name | first_upper }}
			</span>
		</div>
	</div>
</template>
<script>
export default {
	name: 'Category',
	props: {
		/**
		 * Registro con name e image_url (categoría o marca desde el store).
		 */
		item: {
			type: Object,
			required: true,
		},
	},
	computed: {
		/**
		 * Estilo inline del tile: imagen de fondo o degradado si no hay URL válida.
		 * @returns {object}
		 */
		tile_background_style() {
			let resolved_url = this.resolve_tile_image_url(this.item.image_url)
			if (!resolved_url) {
				resolved_url = this.resolve_tile_image_url(
					this.commerce.online_configuration
						? this.commerce.online_configuration.default_article_image_url
						: null
				)
			}
			if (!resolved_url) {
				return {
					backgroundImage: 'linear-gradient(135deg, #3a3a3a 0%, #1a1a1a 100%)',
				}
			}
			return {
				backgroundImage: 'url("' + resolved_url + '")',
			}
		},
	},
	methods: {
		/**
		 * Resuelve URL de imagen (hosting o Cloudinary).
		 * @param {string|null} raw
		 * @returns {string|null}
		 */
		resolve_tile_image_url(raw) {
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
		 * Notifica al padre (categoría o marca) para aplicar la navegación correspondiente.
		 */
		on_tile_click() {
			this.$emit('select', this.item)
		},
	},
}
</script>
<style lang="sass" scoped>
@import '@/sass/_custom'
.category-catalog-tile
	position: relative
	min-height: 200px
	background-size: cover
	background-position: center
	background-repeat: no-repeat
	display: flex
	align-items: center
	justify-content: center
	overflow: hidden
	transition: filter 0.35s ease
	@media screen and (min-width: 992px)
		min-height: 220px
	&:focus
		outline: 2px solid $blue
		outline-offset: 2px
	&__label
		padding: 0.5rem 1.25rem
		background: rgba(0, 0, 0, 0.72)
		transition: background 0.25s ease
	&__title
		color: #fff
		font-weight: bold
		text-transform: uppercase
		font-size: 0.95rem
		text-align: center
		letter-spacing: 0.02em
	@media screen and (max-width: 576px)
		min-height: 160px
		&__title
			font-size: 0.8rem
</style>
