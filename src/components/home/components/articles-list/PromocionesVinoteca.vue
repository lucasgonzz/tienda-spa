<template>
	<div
	class="featured-list"
	v-if="!selected_category && !selected_sub_category && !selected_bodega && !is_from_search && promociones_vinoteca.length">
		<p 
		class="title">
			Promociones
		</p>
		<vue-horizontal-list 
		:items="promociones_vinoteca" :options="options">
			<template v-slot:default="{ item }">
				<article-card
				full_width
				:article="item"></article-card>
			</template>
		</vue-horizontal-list>
	</div>
</template>
<script>
import VueHorizontalList from "vue-horizontal-list"
import categories from "@/mixins/categories"
import VueScreenSize from 'vue-screen-size'
export default {
	name: 'promociones_vinoteca',
	mixins: [categories],
	components: {
		ArticleCard: () => import('@/components/common/article-card/Index'),
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
<style lang="sass">
.paddings
	padding: 0 0 1em
.cont-promociones-vinoteca
	position: relative

.promociones-vinoteca-list
	.vhl-item
		margin: 0 0 70px !important
</style>
