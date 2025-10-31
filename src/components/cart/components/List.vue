<template>
	<div>
		<div
		v-if="cant_cart_items == 0"
		class="text-with-icon text-black">
			<i class="icon-shopping-cart"></i>
			Tu carrito esta vacio
		</div>
		<div
		v-else>
			<p 
			class="title">
				<i class="icon-shopping-cart"></i>
				Mi carrito	
			</p>
			<div class="cont-models">
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