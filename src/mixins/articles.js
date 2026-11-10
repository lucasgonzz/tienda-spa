import { trackear, TIPOS_EVENTO } from '@/utils/tracking'
import { env } from '@/runtime_config'
import { consultas_de_stock_activas, es_articulo_publicado, linea_a_consultar, stock_es_cero, tiene_marca_consulta_stock, variante_de_linea, variante_visible } from '@/helpers/consultas_de_stock'
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
		remove_cart(article) {
			if (confirm('¿Seguro quiere quitar '+article.name+' del carrito?')) {
				
				this.$store.commit('cart/removeArticle', {
					item: this.get_item_cart(article) || article,
					remove_only_one_amount: false
				})
				/*
				 * Igual que cart_add: el evento sale del llamador, que es el único que sabe
				 * que la intención era quitar. Este método es el botón "Quitar" y saca la
				 * línea entera (remove_only_one_amount: false), así que la cantidad quitada
				 * es todo lo que había.
				 */
				trackear(TIPOS_EVENTO.CARRITO_QUITAR, {
					article_id: article.id,
					category_id: article.category_id,
					sub_category_id: article.sub_category_id,
					quantity: article.amount,
				})
				this.$store.commit('auth/setMessage', 'Guardando carrito')
				this.$store.commit('auth/setLoading', true)
				this.$store.dispatch('cart/save')
				.then(() => {
					this.$store.commit('auth/setLoading', false)
				})
				.catch(err => {
					this.$store.commit('auth/setLoading', false)
					console.log(err)
					this.$toast.error('Error al guardar carrito')
				})
			}
		},
		hasStock(article, variante = this.selected_article_variant) {
			/* ignorar_stock (Online Configurations -> Stock): la tienda entera pasa a tratar
			   TODO articulo como ya se trata hoy uno con stock null -- siempre disponible, sin
			   tope -- asi que va primero, antes de mirar variantes y stock_null_equal_0 (que
			   con esto prendido dejan de importar). */
			if (this.commerce.online_configuration.ignorar_stock) {
				return true
			}
			if (article.article_variants && article.article_variants.length) {
				console.log('has_stock variants')
				return !variante || variante.stock === null || variante.stock > 0
			}
			if (this.flag_activo(this.commerce.online_configuration.stock_null_equal_0) && article.stock == null) {
				console.log('NULL es igual a 0 y el stock de '+article.name+' es null')
				return false 
			}
			return article.stock === null || article.stock > 0
		},
		stock_a_consultar_en_ficha(article) {
			if (!consultas_de_stock_activas(this.commerce) || !es_articulo_publicado(article)) {
				return false
			}
			if ((article.article_variants || []).length) {
				const variante = this.selected_article_variant
				return variante
					? variante_visible(variante) && stock_es_cero(variante.stock)
					: this.stock_a_consultar_en_catalogo(article)
			}
			return stock_es_cero(article.stock)
		},
		stock_a_consultar_en_catalogo(article) {
			if (!consultas_de_stock_activas(this.commerce) || !es_articulo_publicado(article)) {
				return false
			}
			const variantes = article.article_variants || []
			if (variantes.length) {
				const visibles = variantes.filter(variante_visible)
				return visibles.some(variante => stock_es_cero(variante.stock))
					&& !visibles.some(variante => variante.stock === null || variante.stock > 0)
			}
			return stock_es_cero(article.stock)
		},
		estado_stock_tarjeta(article) {
			if (this.$route.name === 'Orders' && tiene_marca_consulta_stock(article)) {
				return 'Consultar'
			}
			if (!consultas_de_stock_activas(this.commerce)) {
				return this.hasStock(article) ? '' : 'Agotado'
			}
			const en_carrito = this.$route.name === 'Cart'
			if (en_carrito ? linea_a_consultar(article, this.commerce) : this.stock_a_consultar_en_catalogo(article)) {
				return 'Consultar'
			}
			return this.hasStock(article, en_carrito ? variante_de_linea(article) : null) ? '' : 'Agotado'
		},
		toArticle(article) {
			this.$store.commit('articles/setArticleToShow', article)
			this.set_amount_add_to_cart()
			let params = {slug: article.slug, commerce_id: env('VUE_APP_COMMERCE_ID')}
			console.log('params:')
			console.log(params)
			this.$router.push({name: 'Article', params})
			console.log('se mandaron params')

			setTimeout(() => {
				this.$scrollToTop()
			}, 1000)
		},
		set_amount_add_to_cart() {
			let amount = this.commerce.online_configuration.default_amount_add_to_cart
			if (amount) {
				this.$store.commit('articles/setAmount', amount)
			}
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
			const articulos = this.$store.state.cart.cart.articles
			const ficha = this.article_to_show
			const variante = ficha.pivot && ficha.pivot.variant_id
			const linea = articulos.find(articulo => articulo.id == ficha.id
				&& (!variante || articulo.pivot.variant_id == variante))
			this.checkCartArticleVariant(linea)
			this.checkCartArticleAmount(linea)
			this.checkCartArticleNotes(linea)
		},
		checkCartArticleVariant(article_cart) {
			if (article_cart && article_cart.selected_variant && this.article_to_show.selected_article_properties) {
				article_cart.selected_variant.article_property_values.forEach(article_property_value => {
					this.$set(
						this.article_to_show.selected_article_properties,
						article_property_value.article_property_type.name,
						article_property_value.name
					)
				})
				this.$store.commit('articles/setSelectedArticleVariant', article_cart.selected_variant)
				this.$set(this.article_to_show, 'variant_id', article_cart.selected_variant.id)
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
		checkCartArticleAmount(article_cart) {
			if (article_cart != undefined) {
				console.log('checkCartArticleAmount, article_cart:')
				console.log(article_cart)
				this.$store.commit('articles/setAmount', article_cart.amount)
			} else {

				let promociones_vinoteca = this.$store.state.cart.cart.promociones_vinoteca
				let promo_cart = promociones_vinoteca.find(pr => {
					return pr.id == this.article_to_show.id
				})

				if (promo_cart != undefined) {
					console.log('checkCartArticleAmount, promo_cart:')
					console.log(promo_cart)
					this.$store.commit('articles/setAmount', promo_cart.amount)
				} else {

					this.$store.commit('articles/setAmount', '')
				}

			}
		},
		checkCartArticleNotes(article_cart) {
			if (article_cart != undefined) {
				this.$store.commit('articles/setNotes', article_cart.notes)
			} else {
				this.$store.commit('articles/setNotes', '')
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
