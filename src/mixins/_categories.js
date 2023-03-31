export default {
	methods: {
		setSelectedCategory(category) {
			this.$store.commit('categories/setSelectedCategory', category)
			this.$store.commit('categories/setIsFromSearch', false)
			this.$store.commit('categories/setSelectedSubCategory', null)
			this.$store.dispatch('categories/getArticles')
			if (this.route_name != 'Home' || this.$route.params.category == 'ultimos-ingresados') {
				this.$router.push({name: 'Home'})
			}
			this.$store.commit('auth/setMobileSidebarVisibility', false)
			this.scrollTo('articles-list')
		}
	}
}