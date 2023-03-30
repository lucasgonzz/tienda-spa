<template>
	<b-list-group
	v-show="search_query.length > 2"
	class="no-separate-items no-shadow-items m-t--15">
		<b-list-group-item
		class="text-left"
		@click="setArticle(article)"
		v-for="article in articles_searcheds"
		:key="article.id">
			<i class="icon-search m-r-10"></i>
			{{ article.name }}
		</b-list-group-item>
	</b-list-group>
</template>
<script>
import search from '@/mixins/search'
import articles from '@/mixins/articles'
export default {
	mixins: [search, articles],
	methods: {
		setArticle(article) {
			if (article.repeated) {
				this.$store.commit('articles/setSearchQuery', article.name)
				this.searchArticle()
			} else {
				// this.toArticle(article)
				this.$router.push({name: 'Article', params: {slug: article.slug}})
			}
		}
	}
}
</script>