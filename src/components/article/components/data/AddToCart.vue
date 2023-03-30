<template>
	<div
	v-if="article_to_show.stock == null || article_to_show.stock > 0" 
	class="add-to-cart shadow-2-sm-only">
		<b-button
		v-if="!isArticleInCart()"
		@click="buyNow"
		variant="success"
		class="m-b-15"
		block>
			<btn-loader
			icon="check"
			text="Comprar ahora"
			:loader="saving"></btn-loader>
		</b-button>
		<b-button
		v-if="!isArticleInCart()"
		@click="addToCart"
		variant="success" 
		block>
			<btn-loader
			icon="shopping-cart"
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
</template>
<script>
import BtnLoader from '@/components/common/BtnLoader'
export default {
	name: 'AddToCart',
	components: {
		BtnLoader,
	},
	computed: {
		amount() {
			return this.$store.state.articles.amount
		},
		color() {
			return this.$store.state.articles.color
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
			this.article_to_show.amount = this.amount
			this.article_to_show.color = this.color
			if (this.checkColors() && this.checkSizes()) {
				this.$store.commit('cart/addArticle', this.article_to_show)
				if (this.authenticated) {
					this.$store.dispatch('cart/save')
					this.$router.push({name: 'Payment'})
				} else {
					this.$cookies.set('redirect_to', 'Payment')
					this.$router.push({name: 'Login'})
				}
			}
		},
		addToCart() {
			this.article_to_show.amount = this.amount 
			this.article_to_show.color = this.color 
			this.article_to_show.pivot = {
				amount: this.amount,
				color_id: this.color ? this.color.id : null
			}
			if (this.checkColors() && this.checkSizes()) {
				this.$store.commit('cart/addArticle', this.article_to_show)
				if (this.authenticated) {
					this.$store.dispatch('cart/save')
					.then(() => {
						document.getElementById('added-article-info').classList.add('added-article-info-active')
					})
				} else {
					this.addToCartCookie()
					document.getElementById('added-article-info').classList.add('added-article-info-active')
				}
				// this.$router.push({name: 'Home'})
			}
		},
		addToCartCookie() {
			localStorage.cart = JSON.stringify(this.cart) 
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
	@media screen and (max-width: 992px)
		padding: 1em
		width: 100%
		left: 0
		z-index: 90
		position: fixed
		bottom: 0
		@if ($theme == dark) 
			background: #000
		@else if ($theme == ligth) 
			background: #fff
	@media screen and (min-width: 992px)
		margin-bottom: 20px
</style>