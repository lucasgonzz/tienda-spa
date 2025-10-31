<template>
	<div
	v-if="authenticated">
		
		<div
		v-if="article && articlePriceEfectivo(article) && hasStock(article)" 
		class="add-to-cart m-b-20">
			
			<notes
			:article="article"></notes>	
			

			<div class="cont-input-btn-add">
				<amount
				@addToCart="agregar_al_carrito"
				:article="article"></amount>
			
				<b-button
				v-if="!is_item_in_cart(article)"
				@click="agregar_al_carrito"
				:disabled="amount == '' || amount == 0"
				variant="outline-primary">
					<btn-loader
					text="Agregar"
					icon="cart"
					:loader="saving"></btn-loader>
				</b-button>
				
				<div
				v-else>
					<b-button-group>
						
						<b-button
						@click="update_article_cart()"
						variant="success"
						block>
							Actualizar
						</b-button>
						<b-button
						class="m-0"
						@click="remove_cart(article)"
						variant="outline-danger"
						block>
							<i class="icon-cart"></i>
						</b-button>
					</b-button-group>
				</div>
			</div>
		</div>

		<agotado-info
		:article="article"
		v-else></agotado-info>
	</div>
</template>
<script>
import BtnLoader from '@/components/common/BtnLoader'
import articles from '@/mixins/articles'
export default {
	name: 'AddToCart',
	mixins: [articles],
	props: {
		article: Object,
	},
	components: {
		Amount: () => import('@/components/article/components/data/add-to-cart/Amount'),
		AgotadoInfo: () => import('@/components/article/components/data/add-to-cart/AgotadoInfo'),
		Notes: () => import('@/components/article/components/data/add-to-cart/Notes'),
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
		agregar_al_carrito() {
			this.saveCart()
		},
		update_article_cart() {
			console.log(this.article)
			console.log(this.article.is_promocion_vinoteca)
			let is_promocion_vinoteca = typeof this.article.is_promocion_vinoteca != 'undefined' ? true : false

			this.$store.commit('auth/setMessage', 'Cargando')
			this.$store.commit('auth/setLoading', true)
			this.$api.put('carts/update-article-amount/'+this.cart.id, {
				id: this.article.id,
				is_promocion_vinoteca: is_promocion_vinoteca,
				amount: this.amount
			})
			.then(res => {
				this.$store.commit('cart/setCart', res.data.cart)
				this.$store.commit('auth/setLoading', false)
				this.$toast.success('Carrito actualizado')
			})
			.catch(err => {
				this.$store.commit('auth/setLoading', false)
				this.$toast.error(err)
			})
		},
		saveCart(buy_now = false) {
			let amount = Number(this.amount)
			
			if (amount == ''
				|| amount <= 0) {
				this.$toast.error('Indique una cantidad')
				return
			}
			if (this.checkVariant()) {
				console.log('paso variants')
				this.article.amount = amount 
				this.article.notes = this.notes 
				this.article.pivot = {
					amount: amount,
					notes: this.notes,
					variant_id: this.selected_article_variant ? this.selected_article_variant.id : null
				}
				this.$store.commit('cart/addItem', this.article)
				if (this.authenticated) {

					this.$bvModal.hide('add-to-cart-modal')
					this.$store.commit('auth/setMessage', 'Guardando carrito')
					this.$store.commit('auth/setLoading', true)
					this.$store.dispatch('cart/save')
					.then(() => {

						this.$store.commit('cart/set_added_item', this.article)

						this.$store.commit('auth/setLoading', false)

						if (buy_now) {
							this.$router.push({name: 'Payment'})
						} else {
							this.show_carrito_guardado()
							setTimeout(() => {
								this.hide_carrito_guardado()
							}, 2000)
						}


						this.$store.commit('articles/setAmount', '')
						this.$store.commit('articles/setNotes', '')

					})
					.catch(err => {
						this.$store.commit('auth/setLoading', false)
						console.log(err)
						this.$toast.error('Error al guardar carrito')
					})
				} 
			}
		},
		show_carrito_guardado() {
			document.getElementById('added-article-info').classList.add('added-article-info-active')
		},
		hide_carrito_guardado() {
			document.getElementById('added-article-info').classList.remove('added-article-info-active')
		},
		addToCartCookie() {
			localStorage.cart = JSON.stringify(this.cart) 
		},
		checkVariant() {
			let ok = true 
			if (
				this.article.article_properties
				&& this.article.article_properties.length
			) {
				this.article.article_properties.forEach(property => {
					if (this.article.selected_article_properties[property.id] == 0) {
						this.$toast.error('Seleccione '+property.article_property_type.name)
						ok = false 
					}
				})
			}
			return ok 
		},
		checkColors() {
			if (this.article.colors.length) {
				if (this.article.pivot.color_id) {
					return true
				} else {
					this.$toast.warning('Seleccione un color')	
					return false				
				}
			}
			return true
		},
		checkSizes() {
			if (this.article.sizes.length) {
				if (this.article.size) {
					return true
				} else {
					this.$toast.warning('Seleccione un talle')	
					return false				
				}
			}
			return true
		},
		removeArticleFromCookies() {
			this.$cookies.keys().forEach(key => {
				if (key.includes('article_'+this.article.id)) {
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
	border-top: 1px solid rgba(0,0,0, .1)
	padding-top: 10px

	.cont-input-btn-add
		width: 100%
		display: flex 
		flex-direction: row
		justify-content: space-between
		input  
			width: 25% !important

		button	 
			width: 70%
			margin-left: 10px
</style>