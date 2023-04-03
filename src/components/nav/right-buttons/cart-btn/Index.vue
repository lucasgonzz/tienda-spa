<template>
	<button 
	@click="toCart()"
	class="btn-nav btn-carrito">
		<i 
		:class="getIconActive('Cart', 'shopping-cart')"></i>
		<b-badge 
		v-show="cant_cart_articles > 0"
		variant="danger"
		class="badge">
			{{ cant_cart_articles }}
		</b-badge>
		<added-article-info></added-article-info>
	</button>
</template>
<script>
import cart from '@/mixins/cart'
import nav from '@/mixins/nav'
export default {
	name: 'BtnCarrito',
	mixins: [cart, nav],
	components: {
		AddedArticleInfo: () => import('@/components/nav/right-buttons/cart-btn/AddedArticleInfo'),
	},
	computed: {
		iconClass() {
			if (this.vicibility) {
				return 'icon-shopping-cart'
			}
			return 'icon-shopping-cart-o'
		}
	},
}
</script>
<style lang="sass">
@import '@/sass/_custom'
.btn-carrito
	position: relative
	i 
		font-size: 1.2em
		color: $color_text
	.badge
		padding: 5px 8px
		font-size: 14px
</style>