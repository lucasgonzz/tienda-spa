<template>
	<section
	v-if="enabled && categories.length"
	id="categorias-home"
	class="categorias-home">
		<div class="categorias-home__grid">
			<card
			v-for="category in categories"
			:key="category.id"
			:item="category"
			@select="on_category_selected"></card>
		</div>
	</section>
</template>
<script>
import categories from '@/mixins/_categories'
import Card from '@/components/home/components/categorias-home/Card'

/**
 * Orquestador de la seccion "categorias en el Home" (mision catalogo-categorias-home,
 * 18/9/2026): grilla de tarjetas debajo del banner, una por categoria, visible solo
 * si el comercio prendio online_configuration.mostrar_catalogo_categorias_home.
 *
 * El click en una tarjeta hace EXACTAMENTE lo mismo que el sidebar de categorias
 * (components/nav/categories/Index.vue::setCategory): reusa setSelectedCategory()
 * del mixin _categories, nunca reimplementado aca. Es un atajo hacia algo que ya
 * existe, no navegacion nueva.
 *
 * No dispara ningun fetch propio: las categorias ya estan en el store para cuando
 * Home monta (App.vue las carga con categories/getCategories antes de resolver
 * la ruta inicial).
 */
export default {
	name: 'CategoriasHome',
	mixins: [categories],
	components: {
		Card,
	},
	computed: {
		/**
		 * Categorias publicadas del comercio.
		 * @returns {Array}
		 */
		categories() {
			return this.$store.state.categories.categories
		},
		/**
		 * Toggle de la seccion. Number(...) == 1 y no ===: el valor llega de MySQL
		 * como 0/1/"0"/"1"/null segun si empresa-api de ese comercio ya tiene la
		 * columna (mismo criterio que "mostrar_catalogo" en
		 * components/nav/footer/ItemsList.vue).
		 * @returns {boolean}
		 */
		enabled() {
			return Number(this.commerce.online_configuration.mostrar_catalogo_categorias_home) == 1
		},
	},
	methods: {
		/**
		 * @param {object} category
		 */
		on_category_selected(category) {
			this.setSelectedCategory(category)
		},
	},
}
</script>
<style lang="sass" scoped>
.categorias-home
	padding: 1.5rem 1rem
	&__grid
		display: grid
		grid-template-columns: repeat(2, 1fr)
		gap: 1rem
		max-width: 1200px
		margin: 0 auto
		@media screen and (min-width: 768px)
			grid-template-columns: repeat(3, 1fr)
		@media screen and (min-width: 1200px)
			grid-template-columns: repeat(4, 1fr)
</style>
