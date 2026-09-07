<template>
	<div class="checkout-summary">
		<h2 class="checkout-section__title">
			<i class="bi bi-bag-check"></i>
			Tu pedido
		</h2>

		<div class="checkout-summary__items">
			<last-article
			class="m-b-10"
			v-for="article in cart.articles"
			:key="'art-' + article.id"
			:show_added_info="false"
			:article="article"></last-article>

			<last-article
			class="m-b-10"
			v-for="promo in cart.promociones_vinoteca"
			:key="'promo-' + promo.id"
			:show_added_info="false"
			:article="promo"></last-article>
		</div>

		<total></total>

		<before-confirm-notice></before-confirm-notice>

		<btn-save></btn-save>
	</div>
</template>
<script>
import BeforeConfirmNotice from '@/components/payment/components/BeforeConfirmNotice'

export default {
	components: {
		LastArticle: () => import('@/components/nav/right-buttons/cart-btn/LastArticle'),
		BeforeConfirmNotice,
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
