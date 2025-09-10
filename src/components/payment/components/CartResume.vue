<template>
	<div
	class="background">
		<div class="cart-resume">
			<h5>
				Resumen de la compra
			</h5>
			<last-article 
			v-for="article in cart.articles"
			:show_added_info="false"
			:article="article"></last-article>

			<last-article 
			v-for="promo in cart.promociones_vinoteca"
			:show_added_info="false"
			:article="promo"></last-article>
		</div>
		<total></total>	
		<btn-save></btn-save>
	</div>
</template>
<script>
export default {
	components: {
		LastArticle: () => import('@/components/nav/right-buttons/cart-btn/LastArticle'),
		Total: () => import('@/components/payment/components/payment-method/Total'),
		BtnSave: () => import('@/components/payment/components/BtnSave'),
	},
	computed: {
		cart() {
			return this.$store.state.cart.cart
		}
	}
}
</script>
<style lang="sass">
.cart-resume
	@media screen and (min-width: 768px)
		max-height: 70vh 
		// max-height: 55vh 
		overflow-y: auto	
</style>