<template>
	<div
	class="featured-list"
	v-if="!selected_category && !selected_sub_category && !selected_bodega && !selected_cepa && !is_from_search && combos.length">
		<p
		class="title">
			Combos
		</p>
		<vue-horizontal-list
		:items="combos" :options="options">
			<template v-slot:default="{ item }">
				<combo-card
				full_width
				:combo="item"></combo-card>
			</template>
		</vue-horizontal-list>
	</div>
</template>
<script>
/*
 * Los combos publicados en la tienda (`combos.online = 1`), en un carrusel propio debajo de
 * "Comprando más, pagás menos".
 *
 * 🔴 Usa `combo-card` y NO `article-card`: un combo no tiene imagen propia ni precio unitario
 * por artículo, tiene una receta (`articles[]` con su `pivot.amount`). La tarjeta muestra las
 * imágenes de sus componentes.
 *
 * La sección se esconde entera con categoría, subcategoría, bodega, cepa o búsqueda activa, y
 * con el array vacío — que es lo que pasa cuando la API todavía no manda la clave `combos`.
 */
import VueHorizontalList from "vue-horizontal-list"
import categories from "@/mixins/categories"
import VueScreenSize from 'vue-screen-size'
export default {
	name: 'Combos',
	mixins: [categories],
	components: {
		ComboCard: () => import('@/components/common/combo-card/Index'),
		VueHorizontalList,
	},
	computed: {
		options() {
			let options = {
				responsive: [
					{ end: 576, size: 2 },
					{
						start: 768,
						end: 992,
						size: this.commerce.online_configuration.cantidad_tarjetas_en_notebook },
					{
						start: 992,
						size: this.commerce.online_configuration.cantidad_tarjetas_en_escritorio
					},
				],
				list: {
					// 1200 because @media (min-width: 1200px) and therefore I want to switch to windowed mode
					windowed: 0,

					// Because: #app {padding: 80px 24px;}
					padding: 100,
				},
				position: {
					start: 1,
				},
				autoplay: { play: true, repeat: true, speed: 4000 },
			}

			return options
		}
	}
}
</script>
