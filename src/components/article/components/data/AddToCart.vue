<template>
	<div
	v-if="article_to_show && articlePriceEfectivo(article_to_show) && hasStock(article_to_show)" 
	class="add-to-cart m-b-20">
		<article-amount></article-amount>
		<div class="cont-btn-add">
			<!-- <b-button
			v-if="!isArticleInCart()"
			@click="buyNow"
			variant="success"
			class="m-b-15"
			block>
				<btn-loader
				icon="check"
				text="Comprar ahora"
				:loader="saving"></btn-loader>
			</b-button> -->
			<b-button
			v-if="!isArticleInCart()"
			@click="addToCart"
			variant="success" 
			block>
				<btn-loader
				text="Agregar al carrito"
				:loader="saving"></btn-loader>
			</b-button>
			<b-button
			v-else
			@click="removeCart"
			variant="success"
			block>
				<btn-loader
				icon="shopping-cart"
				text="Quitar del carrito"
				:loader="saving"></btn-loader>
			</b-button>
		</div>
	</div>
</template>
<script>
import BtnLoader from '@/components/common/BtnLoader'
import articles from '@/mixins/articles'
export default {
	name: 'AddToCart',
	mixins: [articles],
	components: {
		ArticleAmount: () => import('@/components/article/components/ArticleAmount'),
		BtnLoader,
	},
	computed: {
		amount() {
			return this.$store.state.articles.amount
		},
		notes() {
			return this.$store.state.articles.notes
		},
		selected_article_variant() {
			return this.$store.state.articles.selected_article_variant
		},
		cart() {
			return this.$store.state.cart.cart
		},
	},
	data() {
		return {
			saving: false,
		}
	},
	methods: {
		buyNow() {
			this.saveCart(true)
		},
		addToCart() {
			this.saveCart()
		},
		saveCart(buy_now = false) {
			if (this.checkVariant()) {
				this.article_to_show.amount = this.amount 
				this.article_to_show.notes = this.notes 
				this.article_to_show.pivot = {
					amount: this.amount,
					notes: this.notes,
					variant_id: this.selected_article_variant ? this.selected_article_variant.id : null
				}
				this.$store.commit('cart/addArticle', this.article_to_show)
				if (this.authenticated) {
					this.$store.dispatch('cart/save')
					.then(() => {
						if (buy_now) {
							this.$router.push({name: 'Payment'})
						} else {
							document.getElementById('added-article-info').classList.add('added-article-info-active')
						}
					})
				} else {
					this.addToCartCookie()
					if (buy_now) {
						this.$cookies.set('redirect_to', 'Payment')
						this.$router.push({name: 'Login'})
					} else {
						document.getElementById('added-article-info').classList.add('added-article-info-active')
					}
				}
			}
		},
		addToCartCookie() {
			localStorage.cart = JSON.stringify(this.cart) 
		},
		checkVariant() {
			let ok = true 
			if (this.article_to_show.article_properties.length) {
				this.article_to_show.article_properties.forEach(property => {
					if (this.article_to_show.selected_article_properties[property.id] == 0) {
						this.$toast.error('Seleccione '+property.article_property_type.name)
						ok = false 
					}
				})
			}
			return ok 
		},
		checkColors() {
			if (this.article_to_show.colors.length) {
				if (this.article_to_show.pivot.color_id) {
					return true
				} else {
					this.$toast.warning('Seleccione un color')	
					return false				
				}
			}
			return true
		},
		checkSizes() {
			if (this.article_to_show.sizes.length) {
				if (this.article_to_show.size) {
					return true
				} else {
					this.$toast.warning('Seleccione un talle')	
					return false				
				}
			}
			return true
		},
		removeCart() {
			this.$store.commit('cart/removeArticle', {
				article_param: this.article_to_show,
				remove_only_one_amount: false
			})
			if (this.authenticated) {
				this.$store.dispatch('cart/save')
			} else {
				this.removeArticleFromCookies()
			}
		},
		removeArticleFromCookies() {
			this.$cookies.keys().forEach(key => {
				if (key.includes('article_'+this.article_to_show.id)) {
					this.$cookies.remove(key)
				}
			})
		},
	}
}
</script>
<style scoped lang="sass">
@import '@/sass/_custom'
.add-to-cart
	display: flex 
	flex-direction: column
	.cont-btn-add
		width: 100%
		button	 
			width: 100% 
			min-height: 50px
			font-size: 18px
			// width: calc(100% - 132px)
</style>