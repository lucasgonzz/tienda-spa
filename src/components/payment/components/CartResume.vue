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

			<!--
				🔴 Los combos NO pueden ir por last-article: esa fila resuelve la imagen con
				articleImage(), que entra derecho a `article.images.length` — y un combo no tiene
				`images`, tiene las de sus artículos componentes. Va con su propia tarjeta, en
				modo carrito.
			-->
			<combo-card
			class="m-b-10"
			v-for="combo in combos"
			:key="'combo-' + combo.id"
			en_carrito
			:combo="combo"></combo-card>
		</div>

		<!--
			Los descuentos y recargos del cliente que ya tienen aplicados los precios de arriba
			(mision descuentos-recargos-por-cliente). Mismo bloque que el resumen del carrito.
		-->
		<ajustes-de-cliente
		class="checkout-summary__ajustes"
		titulo="Este carrito ya tiene aplicados:"
		:ajustes="ajustes_del_carrito(cart)"></ajustes-de-cliente>

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
		ComboCard: () => import('@/components/common/combo-card/Index'),
		BeforeConfirmNotice,
		Total: () => import('@/components/payment/components/payment-method/Total'),
		BtnSave: () => import('@/components/payment/components/BtnSave'),
		AjustesDeCliente: () => import('@/components/common/AjustesDeCliente'),
	},
	computed: {
		cart() {
			return this.$store.state.cart.cart
		},
		/**
		 * Los combos del carrito. El `|| []` es el guard del carrito que vino de una API que
		 * todavía no los conoce: ahí la clave directamente no existe.
		 *
		 * @returns {Array}
		 */
		combos() {
			return this.cart.combos || []
		}
	}
}
</script>
