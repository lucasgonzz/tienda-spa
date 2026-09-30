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
				🔴 Los combos van con su propia tarjeta, en modo carrito, y no por last-article:
				la tarjeta muestra el detalle de qué lleva y resuelve la imagen del combo (foto
				propia o collage de sus componentes). last-article también sabe dibujar un combo
				—lo usa el popup del mini-carrito—, pero acá se prefiere el detalle completo.
			-->
			<!--
				`full_width`: la tarjeta de combo hereda el ancho de `.model` de la grilla de la
				tienda (18% = 5 por fila, ~77px en escritorio) y acá no hay grilla: es una lista
				vertical dentro del panel "Tu pedido". Con `full_width` ocupa todo el panel.
				(En /carrito SÍ hay grilla de tarjetas y no va.)
				`compacta`: con el ancho completo la imagen cuadrada del combo quedaba enorme
				(~670px de alto en escritorio); así es una fila con miniatura a la izquierda.
			-->
			<combo-card
			class="m-b-10"
			v-for="combo in combos"
			:key="'combo-' + combo.id"
			en_carrito
			full_width
			compacta
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
