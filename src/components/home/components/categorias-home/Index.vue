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
			:active="is_selected(category)"
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
		/**
		 * Categoria en la que esta parado el visitante -- la misma que lee el sidebar
		 * de categorias (nav/categories/Index.vue::is_row_active_category) para su
		 * propio resaltado. null si no hay ninguna seleccionada (portada sin filtrar).
		 * @returns {object|null}
		 */
		selected_category() {
			return this.$store.state.categories.selected_category
		},
	},
	methods: {
		/**
		 * @param {object} category
		 */
		on_category_selected(category) {
			this.setSelectedCategory(category)
		},
		/**
		 * @param {object} category
		 * @returns {boolean}
		 */
		is_selected(category) {
			return !!this.selected_category && this.selected_category.id == category.id
		},
	},
}
</script>
<style lang="sass" scoped>
.categorias-home
	padding: 1.5rem 1rem
	// Flexbox y no CSS Grid: con "repeat(N, 1fr)" el grid siempre arma N columnas del ancho
	// completo del contenedor, y con menos de N categorias las tarjetas ocupan las primeras
	// columnas y quedan pegadas a la izquierda -- no queda ancho sobrante para centrar (el bug
	// medido en la captura de Grupo Quino2, 3 categorias contra una grilla de 4 columnas en
	// escritorio). Con flex-wrap + justify-content: center, una fila incompleta se centra sola,
	// para cualquier cantidad de categorias -- no hace falta saber cuantas hay de antemano.
	&__grid
		display: flex
		flex-wrap: wrap
		justify-content: center
		gap: 1rem
		max-width: 1200px
		margin: 0 auto
</style>
