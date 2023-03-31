<template>
	<div
	class="featured-list"
	v-if="!selected_category && !selected_sub_category && !is_from_search">
		<p 
		class="title m-md-b-0">
			Destacados
		</p>
		<vue-horizontal-list 
		v-if="!is_mobile"
		:items="featured" :options="options">
			<template v-slot:default="{ item }">
				<article-card
				:vertical="true"
				:article="item"></article-card>
			</template>
		</vue-horizontal-list>
		<div 
		class="cont-featured"
		v-if="is_mobile">
			<ul 
			class="horizontal-ul paddings">
				<li
				v-for="article in featured"
				:key="article.id">
					<article-card
					:vertical="true"
					:article="article"></article-card>
				</li>
			</ul>
		</div>
	</div>
</template>
<script>
import ArticleCard from '@/components/common/ArticleCard'
import VueHorizontalList from "vue-horizontal-list"
import categories from "@/mixins/categories"
import VueScreenSize from 'vue-screen-size'
export default {
	name: 'Featured',
	mixins: [categories],
	components: {
		ArticleCard,
		VueHorizontalList,
	},
	data() {
		return {
			options: {
				responsive: [
					{ start: 992, size: 4 },
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
				autoplay: { play: false, repeat: false, speed: 2500 },
			},
		}
	},
}
</script>
<style lang="sass">
.paddings
	padding: 0 0 1em
.cont-featured
	position: relative
</style>
