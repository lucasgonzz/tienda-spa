<template>
	<div
	class="buscador-mobile d-lg-none"
	v-if="isSearchView">
		<b-form-input
		@keyup="search"
		id="search-query"
		autocomplete="off" 
		v-model="search_query"
		placeholder="Buscar un producto"></b-form-input>
	</div>
</template>
<script>
import nav_mixin from '@/mixins/nav'
import search from '@/mixins/search'
export default {
	mixins: [nav_mixin, search],
	computed: {
		articles_names() {
			return this.$store.state.articles.articles_names
		},
		search_query: {
			set(query) {
				this.$store.commit('categories/setSearchQuery', query)
			},
			get() {
				return this.$store.state.categories.search_query
			}
		}
	},
	methods: {
		search(e) {
			if (e.key == 'Enter') {
				this.searchArticle()
			} else {
				if (this.search_query.length <= 2) { 
					this.$store.commit('articles/setSearcheds', [])
				} else {
					let articles_searched = this.articles_names.filter(article => {
						return article.name.toLowerCase().includes(this.search_query.toLowerCase())
					})
					this.$store.commit('articles/setSearcheds', articles_searched)
				}
			}
		},
	}
}
</script>
<style lang="sass">
.buscador-mobile 
	width: 85% !important
	input 
		box-shadow: none
		display: block
		border-radius: .5em
</style>