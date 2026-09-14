<template>
	<div
	v-if="mostrar"
	id="formas-de-envio"
	class="checkout-section">
		<h2 class="checkout-section__title">
			<i class="bi bi-truck"></i>
			¿Cómo te lo enviamos?
		</h2>
		<p class="checkout-section__hint">
			{{ hint }}
		</p>

		<!-- Zonas propias del negocio (flujo viejo: delivery_zone_id) -->
		<div
		v-if="delivery_zones.length"
		role="radiogroup"
		aria-label="Envío del negocio">
			<div
			v-for="delivery_zone in delivery_zones"
			:key="'zona-' + delivery_zone.id"
			@click="cart_delivery_zone = delivery_zone"
			@keyup.enter="cart_delivery_zone = delivery_zone"
			@keyup.space.prevent="cart_delivery_zone = delivery_zone"
			:class="{'checkout-option--selected': esta_elegida(delivery_zone)}"
			class="checkout-option"
			role="radio"
			tabindex="0"
			:aria-checked="esta_elegida(delivery_zone) ? 'true' : 'false'">

				<span class="checkout-option__radio"></span>

				<div class="checkout-option__body">
					<p class="checkout-option__name">
						<span
						v-if="commerce.envios_zipnova"
						class="formas-de-envio__prefijo">Envío del negocio:</span>
						{{ delivery_zone.name }}
					</p>
					<p
					v-if="delivery_zone.description"
					class="checkout-option__description">
						{{ delivery_zone.description }}
					</p>
				</div>

				<p class="checkout-option__price">
					{{ price(delivery_zone.price) }}
				</p>
			</div>
		</div>

		<!--
			Envío por correo (Zipnova). Si el comprador ya cotizó en el carrito con el mismo código
			postal, el cotizador muestra esas opciones sin volver a pedirlas (todo vive en el store).
		-->
		<cotizador-envio
		v-if="commerce.envios_zipnova"
		:class="{'formas-de-envio__cotizador--con-zonas': delivery_zones.length}"
		titulo="Envío por correo a tu código postal"
		usar_carrito
		seleccionable></cotizador-envio>
	</div>
</template>
<script>
import cart from '@/mixins/cart'
import CotizadorEnvio from '@/components/common/envio/Cotizador'

/**
 * Formas de envío del checkout, en UNA sola lista: las zonas propias del negocio (si las tiene)
 * y, debajo, las opciones por correo cotizadas con Zipnova (si el comercio lo conectó). Zona y
 * opción de Zipnova nunca conviven: elegir una suelta la otra (mutaciones del store).
 *
 * Reemplaza a DeliveryZones.vue en el checkout desde el 14/9/2026 (ese archivo queda, sin montar).
 */
export default {
	name: 'FormasDeEnvio',
	mixins: [cart],
	components: {
		CotizadorEnvio,
	},
	computed: {
		/**
		 * Solo con envío a domicilio y con alguna forma de envío que ofrecer.
		 * @returns {boolean}
		 */
		mostrar() {
			return Number(this.deliver) === 1 && (this.delivery_zones.length > 0 || !!this.commerce.envios_zipnova)
		},
		hint() {
			if (this.delivery_zones.length && this.commerce.envios_zipnova) {
				return 'Elegí el envío del negocio o cotizá el envío por correo con tu código postal.'
			}
			if (this.commerce.envios_zipnova) {
				return 'Escribí tu código postal para ver los correos que llegan, el costo y los días de entrega.'
			}
			return 'Elegí la zona donde recibís el pedido.'
		},
	},
	methods: {
		/**
		 * Si esta es la zona de envío que el comprador tiene elegida.
		 *
		 * @param {object} delivery_zone
		 * @returns {boolean}
		 */
		esta_elegida(delivery_zone) {
			return !!(this.cart_delivery_zone && this.cart_delivery_zone.id == delivery_zone.id)
		},
	},
}
</script>
<style lang="sass">
.formas-de-envio__prefijo
	font-weight: 500
	color: rgba(0, 0, 0, .55)

.formas-de-envio__cotizador--con-zonas
	margin-top: 1.1rem
	padding-top: 1rem
	border-top: 1px solid rgba(0, 0, 0, .08)
</style>
