<template>
	<div>
		<div
		v-if="last_searchs.length">
			<p class="title m-t-15">Mas buscados</p>
			<div class="cont-models">
				<article-card
				v-for="article in last_searchs"
				:key="article.key"
				:article="article"></article-card>
			</div>
		</div>
		<div
		class="text-with-icon"
		v-else>
			<i class="icon-search"></i>
			Ingresa lo que quieras buscar
		</div>
	</div>
</template>
<script>
import ArticleCard from '@/components/common/ArticleCard'
export default {
	components: {
		ArticleCard,
	},
	computed: {
		last_searchs() {
			return this.$store.state.last_searchs.last_searchs_for_search_page
		}
	}
}
</script>