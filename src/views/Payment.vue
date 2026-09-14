<template>
	<div class="checkout">
		<b-row>
			<b-col
			cols="12"
			lg="11"
			xl="10"
			offset-lg="0"
			offset-xl="1">

				<div class="checkout__header">
					<h1 class="checkout__title">
						Confirmá tu pedido
					</h1>
					<p class="checkout__subtitle">
						Revisá los datos y elegí cómo lo recibís y cómo lo pagás.
					</p>
				</div>

				<b-row>
					<b-col
					cols="12"
					lg="7">

						<whats-app-info></whats-app-info>

						<deliver></deliver>

						<!--
							El formulario de identificación es solo para el comprador que compra sin
							registrarse. Hasta el 7/9/2026 acá había un `v-if/v-else` más un
							`v-if` suelto que, con una tienda que permite comprar sin registro y un
							comprador YA logueado, montaba el bloque de entrega DOS veces.
						-->
						<buyer
						v-if="comprador_invitado"></buyer>

						<seller-select-client></seller-select-client>

						<addresses></addresses>

						<!--
							Formas de envio en una sola lista (zonas del negocio + correo por Zipnova)
							y, si eligio correo, el formulario completo del destino. Reemplazan a
							<delivery-zones> desde el 14/9/2026 (el archivo queda, sin montar).
						-->
						<formas-de-envio></formas-de-envio>

						<direccion-envio></direccion-envio>

						<delivery-day></delivery-day>

						<!--
							El cupon va ANTES de la forma de pago, y no es indistinto: aplicarlo
							limpia la forma de pago elegida (el total cambio y hay que volver a
							elegir sobre el precio nuevo). Con el cupon abajo, el comprador elegia
							Mercado Pago, bajaba, aplicaba el cupon, y el bloque de pago se le
							deseleccionaba arriba, fuera de la vista.
						-->
						<cupon></cupon>

						<payment-method></payment-method>

						<description></description>

					</b-col>

					<b-col
					cols="12"
					lg="5">
						<cart-resume></cart-resume>
					</b-col>
				</b-row>

			</b-col>
		</b-row>
	</div>
</template>
<script>
import Deliver from '@/components/payment/components/Deliver'
import PaymentMethod from '@/components/payment/components/payment-method/Index'
import Addresses from '@/components/payment/components/Addresses'
import FormasDeEnvio from '@/components/payment/components/FormasDeEnvio'
import DireccionEnvio from '@/components/payment/components/DireccionEnvio'
import Cupon from '@/components/payment/components/cupon/Index'
import Description from '@/components/payment/components/Description'
import { trackear, TIPOS_EVENTO } from '@/utils/tracking'
export default {
	components: {
		WhatsAppInfo: () => import('@/components/payment/components/WhatsAppInfo'),
		CartResume: () => import('@/components/payment/components/CartResume'),
		SellerSelectClient: () => import('@/components/payment/components/SellerSelectClient'),
		Buyer: () => import('@/components/payment/components/Buyer'),
		DeliveryDay: () => import('@/components/payment/components/DeliveryDay'),
		Deliver,
		PaymentMethod,
		Addresses,
		FormasDeEnvio,
		DireccionEnvio,
		Cupon,
		Description,
	},
	created() {
		this.setTitle('Pedido')
		this.$store.commit('cart/setPaymentMethod', null)
		/* El comprador entró a confirmar la compra. El par con checkout_complete es lo que
		   deja medir el abandono del checkout. */
		trackear(TIPOS_EVENTO.CHECKOUT_INICIO)
	},
	computed: {
		/**
		 * Comprador que está comprando sin cuenta, en una tienda que lo permite: es el único que
		 * ve el formulario de identificación del checkout.
		 *
		 * @returns {boolean}
		 */
		comprador_invitado() {
			return !this.flag_activo(this.commerce.online_configuration.register_to_buy) && !this.authenticated
		},
		cart_buyer() {
			return this.$store.state.cart.buyer
		},
	},
}
</script>
