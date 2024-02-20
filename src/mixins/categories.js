export default {
	computed: {
		categories() {
			return this.$store.state.categories.categories
		},
		sub_categories() {
			return this.$store.state.categories.sub_categories
		},
		featured() {
			return this.$store.state.categories.featured
		},
		in_offer() {
			return this.$store.state.categories.in_offer
		},
		novedades() {
			return this.$store.state.categories.novedades
		},
		articles() {
			return this.$store.state.categories.articles
		},
		selected_category() {
			return this.$store.state.categories.selected_category
		},
		selected_sub_category() {
			return this.$store.state.categories.selected_sub_category
		},
		is_from_search() {
			return this.$store.state.categories.is_from_search
		},
		loading_categories() {
			return this.$store.state.categories.loading_categories
		},
		loading_sub_categories() {
			return this.$store.state.categories.loading_sub_categories
		},
		loading_articles() {
			return this.$store.state.categories.loading_articles
		},
		featuredClass() {
			if (this.featured) {
				return 'category-selected'
			}
		},
	},
	methods: {
		setSelectedCategory(category, from_mobile) {
			this.$store.commit('categories/setSelectedCategory', category)
			if (category.is_index) {
				this.$store.commit('categories/setPage', 1)
				this.$store.commit('categories/setSelectedSubCategory', {name: 'Ultimos ingresados'})
				this.$store.dispatch('categories/getIndex')
				if (this.route_name != 'Home') {
					this.$router.push({name: 'Home'})
				}
				if (this.$route.params.category != 'ultimos-ingresados') {
					this.$router.push({params: {category: 'ultimos-ingresados'}})
				}
			} else {
				if (this.route_name != 'Home') {
					this.$router.push({name: 'Home'})
				}
				this.$router.push({params: {category: this.routeString(category.name)}})
				
				this.$store.dispatch('categories/getSubCategories')
				.then(() => {
					this.$store.commit('categories/setSelectedSubCategory', this.sub_categories[0])
					this.$store.dispatch('categories/getArticles')
				})
			}
			this.scrollTo('articles-list', 300, 170)
		},
		setSelectedSubCategory(sub_category) {
			this.$store.commit('categories/setSelectedSubCategory', sub_category)
			this.$store.dispatch('categories/getArticles')
			this.scrollTo('articles-list', 500, 170)
		},
		isSelectedSubCategory(sub_category) {
			return this.selected_sub_category && this.selected_sub_category.id == sub_category.id
		},
		subCategoryClass(sub_category) {
			if (this.selected_sub_category && this.selected_sub_category.id == sub_category.id) {
				return 'sub-category-selected'
			}
		},
		categoryClass(category) {
			if (this.isSelectedCategory(category)) {
				return 'category-selected'
			}
		},
		isSelectedCategory(category) {
			if (this.selected_category && this.selected_category.id == category.id) {
				if (this.use_icons) {
					return 'category-selected-with-icon'
				}
				return 'category-selected'
			}
			return ''
		},
	}
}