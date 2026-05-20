<template>
	<button 
	@click="toCart()"
	class="btn-nav btn-carrito">
		<!-- <i 
		:class="getIconActive('Cart', 'shopping-cart')"></i> -->
		<!-- <img src="@/assets/cart.png" alt=""> -->
		<i class="bi bi-cart3"></i>
		<b-badge 
		v-show="cant_cart_items > 0"
		variant="danger"
		class="badge">
			{{ cant_cart_items }}
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
				return 'bi bi-cart3-fill'
			}
			return 'bi bi-cart3'
		}
	},
}
</script>
<style lang="sass">
@import '@/sass/_custom'
.btn-carrito
	position: relative
	i 
		font-size: 30px
		color: $color_text !important
	img 
		width: 40px
	.badge
		padding: 5px 8px
		font-size: 14px
</style>