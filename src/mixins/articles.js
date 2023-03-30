export default {
	computed: {
		color() {
			return this.$store.state.articles.color 
		},
	},
	methods: {
		getArticlesPerPage(vssWidth) {
			let per_page
			console.log('vssWidth: '+vssWidth)
			if (vssWidth < '992') {
				per_page = 6
			} else if (vssWidth < '1200') {
				per_page = 8
			} else {
				per_page = 10
			}
			console.log('per_page: '+per_page)
			return per_page
		},
		toArticle(article) {
			this.$store.commit('articles/setArticleToShow', article)
			let params = {slug: article.slug, commerce_id: process.env.VUE_APP_COMMERCE_ID}
			this.$router.push({name: 'Article', params})
			this.$scrollToTop()
		},
		setColorAndImages(color = null) {
			if (!color) {
				color = this.article_to_show.colors[0]
			}
			this.$store.commit('articles/setColor', color)
			// this.$set(this.article_to_show, 'color', color)
			// this.checkColorsImages()
		},
		// checkColorsImages() {
		// 	if (this.article_to_show.colors.length) {
		// 		// if (!this.article.color) {
		// 		// 	this.article.color = this.article.colors[0]
		// 		// }
		// 		let images = this.getImagesFromSelectedColor(this.article_to_show)
		// 		let images_generales = this.article_to_show.images.filter(image => {
		// 			return !image.color_id 
		// 		})
		// 		this.$store.commit('articles/setImages', images.concat(images_generales))
		// 	} else {
		// 		this.article_to_show.images_to_show = this.article_to_show.images
		// 	}
		// },
		getImagesFromSelectedColor(article) {
			return article.images.filter(image => {
				return image.color_id == this.color.id
			})
		},
		checkCartArticle() {
			this.checkCartArticleColor()
			this.checkCartArticleSize()
			this.checkCartArticleAmount()
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
		hasVariants(article) {
			if (article.variants.length) {
				return true
			}
			return false
		},
		setArticleViewed(article) {
			this.$api.get('/articles/set-viewed/'+article.id)
			.catch(err => {
				console.log(err)
			})
		},
		setArticleVariant(article) {
			if (article.pivot.variant_id) {
				article.variant = article.variants.find(variant => {
					return variant.id == article.pivot.variant_id
				})
			}
			return article
		},
		setArticlesVariant(model) {
			model.articles.forEach(article => {
				if (article.pivot.variant_id) {
					article.variant = article.variants.find(variant => {
						return variant.id == article.pivot.variant_id
					})
				}
			})
			return model
		},
	}
}