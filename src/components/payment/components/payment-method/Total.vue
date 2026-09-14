<template>
	<div class="checkout-summary__lines">
		<p class="checkout-summary__line">
			Subtotal ({{ cant_articles_text }})
			<span>{{ price(total) }}</span>
		</p>

		<p
		v-if="cart_payment_method && cart_payment_method.discount"
		class="checkout-summary__line checkout-summary__line--good">
			Descuento por {{ cart_payment_method.name }} ({{ porcentaje(cart_payment_method.discount) }}%)
			<span>- {{ price(total - total_with_payment_method_discount) }}</span>
		</p>

		<p
		v-if="cart_payment_method && cart_payment_method.surchage"
		class="checkout-summary__line">
			Recargo por {{ cart_payment_method.name }} ({{ porcentaje(cart_payment_method.surchage) }}%)
			<span>+ {{ price(total_with_payment_method_surchage - total) }}</span>
		</p>

		<p
		v-if="cupon"
		class="checkout-summary__line checkout-summary__line--good">
			<span
			v-if="cupon.amount"
			class="checkout-summary__concept">
				Cupón de {{ price(cupon.amount) }}
			</span>
			<span
			v-else
			class="checkout-summary__concept">
				Cupón del {{ porcentaje(cupon.percentage) }}%
			</span>
			<span>- {{ price(total_with_payment_method - total_with_cupon) }}</span>
		</p>

		<p
		v-if="cart.deliver && cart_delivery_zone"
		class="checkout-summary__line">
			Envío ({{ cart_delivery_zone.name }})
			<span>+ {{ price(cart_delivery_zone.price) }}</span>
		</p>

		<!--
			Envío por correo (Zipnova). El precio es el de la opción cotizada por el servidor
			(`precio`, con la regla de envío gratis ya aplicada): la pantalla nunca lo calcula.
		-->
		<p
		v-else-if="cart.deliver && cart_envio_opcion"
		class="checkout-summary__line"
		:class="{'checkout-summary__line--good': envio_es_gratis}">
			<span class="checkout-summary__concept">
				Envío ({{ cart_envio_opcion.carrier_name }} · {{ cart_envio_opcion.service_name }})
			</span>
			<span v-if="envio_es_gratis">Gratis</span>
			<span v-else>+ {{ price(cart_envio_opcion.precio) }}</span>
		</p>

		<p class="checkout-summary__total">
			Total
			<span>{{ price(total_a_pagar) }}</span>
		</p>
	</div>
</template>
<script>
import cart from '@/mixins/cart'
export default {
	mixins: [cart],
	computed: {
		/**
		 * Cuantas unidades lleva el pedido. Antes decia "productos" contando UNIDADES, asi que dos
		 * productos con tres unidades se leia "3 productos".
		 *
		 * @returns {string}
		 */
		cant_articles_text() {
			return this.cant_cart_items + ' ' + this.cart_units_label
		},
		/**
		 * Lo que el comprador va a pagar, con todo aplicado.
		 *
		 * El envío sale de `envio_precio_elegido` del mixin, que suma la zona propia o la opción
		 * de Zipnova SOLO con envío a domicilio — las mismas condiciones con las que se muestran
		 * las líneas de arriba, así que el total mostrado siempre cierra con el desglose que está a
		 * la vista. (Hasta el 14/9/2026 se calculaba acá porque `total_final` del mixin reventaba
		 * con la zona en null; eso ya se arregló en el mixin.)
		 *
		 * Es un cálculo de PANTALLA: lo que efectivamente se cobra lo resuelve la API
		 * (OnlinePaymentHelper con `carts.envio_precio` / la zona guardada), y esto no lo cambia.
		 *
		 * @returns {number}
		 */
		total_a_pagar() {
			return this.total_with_deliver
		},
		/**
		 * Si la opción de correo elegida sale gratis para el comprador (regla de envío gratis del
		 * comercio, o precio cero).
		 *
		 * @returns {boolean}
		 */
		envio_es_gratis() {
			let opcion = this.cart_envio_opcion
			return !!(opcion && (opcion.envio_gratis || Number(opcion.precio) === 0))
		},
	},
	methods: {
		/**
		 * Porcentaje legible: la columna es decimal(12,2) y llega como "5.00".
		 *
		 * @param {string|number} valor
		 * @returns {string}
		 */
		porcentaje(valor) {
			const numero = Number(valor)
			if (!isFinite(numero)) {
				return String(valor)
			}
			return String(Number(numero.toFixed(2)))
		},
	},
}
</script>
