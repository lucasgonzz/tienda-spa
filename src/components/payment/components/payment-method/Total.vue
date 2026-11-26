<template>
	<div class="checkout-summary__lines">
		<p class="checkout-summary__line">
			Subtotal ({{ cant_articles_text }})
			<span>{{ price(total_web) }}</span>
		</p>

		<p
		v-if="!pedido_a_consultar && cart_payment_method && cart_payment_method.discount"
		class="checkout-summary__line checkout-summary__line--good">
			Descuento por {{ cart_payment_method.name }} ({{ porcentaje(cart_payment_method.discount) }}%)
			<span>- {{ price(total_web - total_with_payment_method_discount) }}</span>
		</p>

		<p
		v-if="!pedido_a_consultar && cart_payment_method && cart_payment_method.surchage"
		class="checkout-summary__line">
			Recargo por {{ cart_payment_method.name }} ({{ porcentaje(cart_payment_method.surchage) }}%)
			<span>+ {{ price(total_with_payment_method_surchage - total_web) }}</span>
		</p>

		<!--
			Forma propia. Si es "a convenir" (19/10/2026) no suma nada: el costo lo coordina el
			vendedor después, y la línea lo dice en vez de mostrar un precio (nunca "Gratis").
		-->
		<p
		v-if="cart.deliver && cart_delivery_zone"
		class="checkout-summary__line"
		:class="envio_zona_resuelta.gratis ? 'checkout-summary__line--good' : ''">
			Envío ({{ cart_delivery_zone.name }})
			<span v-if="zona_elegida_a_convenir">A coordinar</span>
			<!-- Envío gratis (26/11/2026): la regla ya aplicada en `envio_zona_resuelta` (mixin del carrito). -->
			<span v-else-if="envio_zona_resuelta.gratis">Gratis</span>
			<span v-else>+ {{ price(envio_zona_resuelta.precio) }}</span>
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
			{{ pedido_a_consultar ? 'Total estimado' : 'Total' }}
			<span v-if="linea_de_cuotas">{{ linea_de_cuotas }}</span>
			<span v-else>{{ price(total_a_pagar) }}</span>
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
			if (this.pedido_a_consultar) {
				// Con el recargo de la tienda, igual que el Subtotal: las líneas visibles tienen que sumar el total.
				return this.total_web + this.envio_precio_elegido
			}
			return this.total_with_deliver
		},
		/**
		 * Con la tarjeta dentro de la página, la línea de total sale de la opción elegida que calculó el servidor:
		 * «N cuotas de $X» con cuotas, o el total de la opción con 1 pago. Sin tarjeta (u opciones todavía sin
		 * cargar) es vacío y se muestra el total de siempre.
		 *
		 * @returns {string}
		 */
		linea_de_cuotas() {
			let metodo = this.cart_payment_method
			if (this.pedido_a_consultar || !metodo || !metodo.type || metodo.type.name !== 'Tarjeta Mercado Pago') {
				return ''
			}
			let estado = this.$store.state.cart.tarjeta_mp
			let elegidas = estado.opciones.filter(o => o.cuotas === estado.cuotas)
			if (!elegidas.length) {
				return ''
			}
			// 1 pago: el total de la opción del servidor (el mismo número del botón de pagar), no el del navegador.
			if (elegidas[0].cuotas <= 1) {
				return this.price(elegidas[0].total)
			}
			return elegidas[0].cuotas + ' cuotas de ' + this.price(elegidas[0].valor_cuota)
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
