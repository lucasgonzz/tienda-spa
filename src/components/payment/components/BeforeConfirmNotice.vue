<template>
	<div
	v-if="has_notice"
	class="before-confirm-notice">
		<div
		class="before-confirm-notice__prose"
		v-html="notice_html"></div>
	</div>
</template>

<script>
import generals from '@/mixins/generals'

/**
 * Aviso configurable desde online configurations de empresa.
 * Se muestra en confirmar compra, debajo del listado del resumen.
 */
export default {
	name: 'BeforeConfirmNotice',
	mixins: [generals],
	computed: {
		/**
		 * HTML del aviso persistido en online_configuration.
		 *
		 * @returns {string}
		 */
		notice_html() {
			if (
				!this.commerce
				|| !this.commerce.online_configuration
			) {
				return ''
			}

			return this.commerce.online_configuration.aviso_antes_de_confirmar_compra || ''
		},
		/**
		 * Indica si hay contenido visible (ignora etiquetas vacías del editor).
		 *
		 * @returns {boolean}
		 */
		has_notice() {
			const plain_text = String(this.notice_html)
				.replace(/<[^>]*>/g, ' ')
				.replace(/&nbsp;/gi, ' ')
				.replace(/\s+/g, ' ')
				.trim()

			return plain_text.length > 0
		},
	},
}
</script>

<style lang="sass">
.before-confirm-notice
	margin: 1rem 0 0.5rem
	padding: 0.85rem 0.95rem
	background: color-mix(in srgb, var(--secondary-color) 7%, #fff)
	border-radius: 10px
	border: 1px solid rgba(0, 0, 0, 0.06)
	border-left: 3px solid var(--secondary-color)

.before-confirm-notice__prose
	font-size: 0.92rem
	line-height: 1.55
	color: #333
	text-align: left

	p
		margin-bottom: 0.65rem

		&:last-child
			margin-bottom: 0

	h2,
	h3,
	h4
		font-weight: 700
		color: #1a1a1a
		margin-top: 0.85rem
		margin-bottom: 0.45rem
		line-height: 1.3

		&:first-child
			margin-top: 0

	h2
		font-size: 1.05rem

	h3
		font-size: 0.98rem

	h4
		font-size: 0.92rem

	ul,
	ol
		margin: 0 0 0.65rem
		padding-left: 1.2rem

	li
		margin-bottom: 0.25rem

	a
		color: var(--secondary-color)
		font-weight: 600
		text-decoration: none

		&:hover
			text-decoration: underline
			color: var(--primary-color)

	strong
		font-weight: 700
		color: #222
</style>
