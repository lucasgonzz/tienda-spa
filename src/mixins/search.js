export default {
	methods: {
		searchArticle() {
			this.$store.dispatch('categories/searchArticles')
			if (this.$route.name != 'Home') {
				this.$router.push({name: 'Home'})
			}
			this.scrollTo('articles-list')
		},
	}
}