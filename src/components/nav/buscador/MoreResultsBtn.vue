<template>
	<!-- Pie fijo de la caja: botón "Ver todos los resultados" como fila minimalista -->
	<div
	v-if="results.length >= 6"
	@click="moreResults"
	class="nav-search-more-results">
		Ver todos los resultados
	</div>
</template>
<script>
import search from '@/mixins/search'
export default {
	mixins: [search],
	props: {
		results: Array,
	},
	methods: {
		/**
		 * Ejecuta la búsqueda completa (navega a la página de resultados).
		 * Emite clearResults para limpiar la caja del buscador.
		 */
		moreResults() {
			this.$emit('clearResults')
			this.searchArticle()
		}
	}
}
</script>
<style lang="sass">
@import '@/sass/_custom'

.nav-search-more-results
	/* Fila de pie fijo de la caja de resultados */
	display: flex
	align-items: center
	justify-content: center
	width: 100%
	padding: 12px
	font-size: 14px
	color: var(--secondary-color)
	cursor: pointer
	border-top: 1px solid rgba(0, 0, 0, .06)
	transition: background .15s

	&:hover
		background: #f5f5f7
</style>