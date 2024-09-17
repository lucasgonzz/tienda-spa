<template>
	<div
	v-if="loading_last_cart">
		<loading></loading>
	</div>
	<div
	v-else>
		<div
		v-if="!articles.length"
		class="text-with-icon">
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
			</div>
			<p class="total title m-t-20 m-lg-t-0">
				<strong>
					Total: {{ price(total) }}
				</strong>
			</p>
			<!-- <p 
			v-if="percentage_card"
			class="total">
				Con tarjetas: {{ price(total) }}
			</p> -->
			<b-button
			block
			class="m-b-15 btn-pay"
			size="lg"
			@click="next">
				Iniciar compra
			</b-button>
			<b-button
			block
			size="lg"
			:to="{name: 'Home'}"
			variant="success">
				Ver mas productos
			</b-button>
		</div>
	</div>
</template>
<script>
import Loading from '@/components/cart/components/Loading' 
import ArticleCard from '@/components/common/ArticleCard' 
import BtnLoader from '@/components/common/BtnLoader'

import cart from '@/mixins/cart' 
export default {
	name: 'CartList',
	mixins: [cart],
	components: {
		Loading,
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