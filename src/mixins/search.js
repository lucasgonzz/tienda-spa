import articles from '@/mixins/articles'
export default {
	mixins: [articles],
	computed: {
		articles_searcheds() {
			return this.$store.state.articles.searcheds
		},
		search_query() {
			return this.$store.state.categories.search_query
		},
	},
	methods: {
		searchArticle() {
			this.$store.commit('categories/setPage', 1)
			this.$store.dispatch('categories/searchArticles')
			if (this.$route.path != '/') {
				this.$router.push({name: 'Home'})
				this.scrollTo('articles-list', 1000, 170)
			}
		},
	}
}