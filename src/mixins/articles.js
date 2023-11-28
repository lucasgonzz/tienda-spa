export default {
	computed: {
		color() {
			return this.$store.state.articles.color 
		},
		article_to_show() {
			return this.$store.state.articles.article_to_show
		},
		selected_article_variant() {
			return this.$store.state.articles.selected_article_variant
		},
	},
	methods: {
		hasStock(article) {
			if (article.article_variants.length) {
				console.log('has_stock variants')
				return !this.selected_article_variant || this.selected_article_variant.stock === null || this.selected_article_variant.stock > 0
			}
			if (this.commerce.online_configuration.stock_null_equal_0 && article.stock == null) {
				console.log('NULL es igual a 0 y el stock de '+article.name+' es null')
				return false 
			}
			return article.stock === null || article.stock > 0
		},
		toArticle(article) {
			this.$store.commit('articles/setArticleToShow', article)
			let params = {slug: article.slug, commerce_id: process.env.VUE_APP_COMMERCE_ID}
			this.$router.push({name: 'Article', params})
			this.$scrollToTop()
		},
		setVariantImage() {
			let index = this.article_to_show.images.findIndex(image => {
				return image.hosting_url == this.selected_article_variant.image_url 
			})
			this.$store.commit('articles/setImageIndex', index)
		},
		// setColorAndImages(color = null) {
		// 	if (!color) {
		// 		color = this.article_to_show.colors[0]
		// 	}
		// 	this.$store.commit('articles/setColor', color)
		// 	// this.$set(this.article_to_show, 'color', color)
		// 	// this.checkColorsImages()
		// },
		checkCartArticle() {
			this.checkCartArticleVariant()
			this.checkCartArticleAmount()
		},
		checkCartArticleVariant() {
			let articles = this.$store.state.cart.cart.articles
			let article_cart = articles.find(art => {
				return art.id == this.article_to_show.id
			})
			if (article_cart != undefined && article_cart.selected_variant) {
				// let color = this.article_to_show.colors.find(c => {
				// 	return c.id == article_cart.pivot.color_id
				// })
				// this.article_to_show.color = color

				article_cart.selected_variant.article_property_values.forEach(article_property_value => {
					this.article_to_show.selected_article_properties[article_property_value.article_property_type_id] = article_property_value.id
				})
				this.$store.commit('articles/setSelectedArticleVariant', article_cart.selected_variant)
				this.setVariantImage()
			}
		},
		checkCartArticleColor() {
			let articles = this.$store.state.cart.cart.articles
			let article_cart = articles.find(art => {
				return art.id == this.article_to_show.id
			})
			if (article_cart != undefined && article_cart.pivot.color_id) {
				let color = this.article_to_show.colors.find(c => {
					return c.id == article_cart.pivot.color_id
				})
				this.article_to_show.color = color
			}
		},
		checkCartArticleSize() {
			let articles = this.$store.state.cart.cart.articles
			let article_cart = articles.find(art => {
				return art.id == this.article_to_show.id
			})
			if (article_cart != undefined && article_cart.pivot.size_id) {
				let size = this.article_to_show.sizes.find(s => {
					return s.id == article_cart.pivot.size_id
				})
				this.article_to_show.size = size
			}
		},
		checkCartArticleAmount() {
			let articles = this.$store.state.cart.cart.articles
			let article_cart = articles.find(art => {
				return art.id == this.article_to_show.id
			})
			if (article_cart != undefined) {
				this.$store.commit('articles/setAmount', article_cart.amount)
			}
		},
		setArticleViewed(article) {
			this.$api.get('/articles/set-viewed/'+article.id)
			.catch(err => {
				console.log(err)
			})
		},
	}
}