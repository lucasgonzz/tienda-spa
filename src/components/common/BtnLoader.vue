<template>
	<span>
		<span 
		v-show="loader"
		class="spinner-border spinner-border-sm"></span>
		<span v-show="!loader && bi_icon_classes != ''">
			<i :class="bi_icon_classes"></i>
		</span>
		<span v-show="!loader && text != ''">
			{{ text }}
		</span>
	</span>
</template>
<script>
/**
 * Sufijos Bootstrap Icons (sin el prefijo `bi-`) para valores históricos de la prop `icon`.
 */
const LEGACY_ICON_TO_BI_SUFFIX = {
	'paper-plane': 'send-fill',
	'cart': 'cart-plus',
	'search': 'search',
}

export default {
	props: ['loader', 'text', 'icon'],
	computed: {
		/**
		 * Devuelve clases `bi bi-...` según `icon`, o cadena vacía si no corresponde mostrar ícono.
		 *
		 * @returns {string}
		 */
		bi_icon_classes() {
			if (this.icon === undefined || this.icon === null) {
				return ''
			}
			const key = String(this.icon).trim()
			if (key === '') {
				return ''
			}
			const suffix = LEGACY_ICON_TO_BI_SUFFIX[key] || key.replace(/_/g, '-')
			return 'bi bi-' + suffix
		},
	},
}
</script>
<style scoped lang="sass">
.spinner-border
	margin-bottom: .2em
	margin-right: .1em
</style>
