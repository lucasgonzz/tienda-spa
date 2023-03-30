<template>
	<div
	class="buscador-desktop d-none d-lg-block">
		<autocomplete 
		@click="goToSearchPage"
		:search="search" 
		ref="article-search"			
		:get-result-value="getResultValue"
		placeholder="Buscar un producto"
		@submit="setArticle"></autocomplete>
	</div>
</template>
<script>
import Autocomplete from '@trevoreyre/autocomplete-vue'

import nav_mixin from '@/mixins/nav'
import search from '@/mixins/search'
export default {
	components: { 
		Autocomplete,
	},
	mixins: [nav_mixin, search],
	data() {
		return {
			query: ''
		}
	},
	computed: {
		articles_names() {
			return this.$store.state.articles.articles_names
		},
		last_searchs_() {
			return this.$store.state.last_searchs.last_searchs
		},
		last_searchs() {
			let res = this.last_searchs_.filter(last => {
				return last.body.includes(this.search_query.toLowerCase())
			})
			let array = []
			res.forEach(last => {
				array.push({name: last.body, is_last_search: true})
			})
			return array
		},
		search_query() {
			return this.$refs['article-search'].value
		},
	},
	methods: {
		goToSearchPage() {
			if (this.$route.name != 'Search') {
				this.$router.push({name: 'Search'})
				this.$scrollToTop()
			}
		},
		setArticle(article) {
			this.$store.commit('categories/setSearchQuery', this.search_query.replace(' ', '-'))
			this.searchArticle()
		},
		search(input) {
			if (input.length < 2) { 
				return this.last_searchs 
			}
			let articles_searched = this.articles_names.filter(article => {
				return article.name.toLowerCase().includes(input.toLowerCase())
			})
			this.$store.commit('articles/setSearcheds', articles_searched)
			return articles_searched
		},
		getResultValue(article) {
			return article.name
		},
	}
}
</script>
<style lang="sass">
.buscador-desktop
	.autocomplete-input
	@media screen and (max-width: 1200px)
		margin-left: 25px
		width: 40%
	@media screen and (min-width: 1200px)
		width: 50%
		margin-left: 50px
</style>