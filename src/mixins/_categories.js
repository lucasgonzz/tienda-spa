export default {
	methods: {
		setSelectedCategory(category) {
			this.$bvModal.hide('add-to-cart-modal')
			this.$store.commit('categories/setSelectedCategory', category)
			this.$store.commit('categories/setIsFromSearch', false)
			this.$store.commit('categories/setSelectedSubCategory', null)
			this.$store.commit('categories/setSelectedBodega', null)
			this.$store.dispatch('categories/getArticles')
			this.$router.push({name: 'Home', params: {category: this.routeString(category.name)}})
			// if (this.route_name != 'Home' || this.$route.params.category == 'ultimos-ingresados') {
			// 	this.$router.push({name: 'Home'})
			// }
			this.$store.commit('auth/setMobileSidebarVisibility', false)
			this.scrollTo('articles-list')
		},
		setSubCategory(category, sub_category) {
			this.$bvModal.hide('add-to-cart-modal')
			console.log(sub_category)
			this.$router.push({name: 'Home', params: {category: this.routeString(category.name), sub_category: this.routeString(sub_category.name)}})
			this.$store.commit('categories/setSelectedCategory', null)
			this.$store.commit('categories/setSelectedBodega', null)
			this.$store.commit('categories/setSelectedSubCategory', sub_category)
			this.$store.commit('categories/setIsFromSearch', false)
			this.$store.dispatch('categories/getArticles')
			this.$store.commit('auth/setMobileSidebarVisibility', false)
			this.scrollTo('articles-list')
		}
	}
}