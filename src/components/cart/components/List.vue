<template>
	<div>
		<div
		v-if="cant_cart_items == 0"
		class="cart-list-empty text-with-icon text-black">
			<i class="bi bi-cart3 cart-list-empty__icon"></i>
			<span class="cart-list-empty__text">Tu carrito está vacío</span>
		</div>
		<div
		v-else>
			<p 
			v-if="!hide_title"
			class="title">
				<i class="bi bi-cart3"></i>
				Mi carrito	
			</p>
			<div class="cont-models cart-list-cont-models">
				<article-card
				v-for="article in articles"
				:key="article.key"
				:article="article"></article-card>
				
				<article-card
				v-for="promo in promociones_vinoteca"
				:key="promo.key"
				:article="promo"></article-card>
				
			</div>
		</div>
	</div>
</template>
<script>
import ArticleCard from '@/components/common/article-card/Index' 
import BtnLoader from '@/components/common/BtnLoader'

import cart from '@/mixins/cart' 
export default {
	name: 'CartList',
	mixins: [cart],
	props: {
		/**
		 * Oculta el encabezado "Mi carrito" cuando la vista padre ya muestra un título (p. ej. Cart.vue).
		 */
		hide_title: {
			type: Boolean,
			default: false,
		},
	},
	components: {
		ArticleCard,
		BtnLoader,
	},
	computed: {
	},
	methods: {
		next() {
			if (this.authenticated) {
				if (this.canMakeOrder()) {
					this.$router.push({name: 'Payment'})
					this.$scrollToTop()
				}
			} else {
				if (this.commerce.online_configuration.register_to_buy) {
					this.$cookies.set('redirect_to', 'Payment')
					this.$router.push({name: 'Login'})
				} else {
					this.$router.push({name: 'Payment'})
				}
			}
		},
	}
}
</script>
<style lang="sass">
.total 
	text-align: left
	font-size: 25px
</style>