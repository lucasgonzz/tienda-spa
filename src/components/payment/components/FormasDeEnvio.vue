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

				<!--
					Forma "a convenir" (19/10/2026): no se cobra en la tienda, el vendedor coordina el
					costo y la entrega después. Nunca "Gratis" ni "$0": no es gratis, es a coordinar.
				-->
				<p
				v-if="es_a_convenir(delivery_zone)"
				class="checkout-option__price formas-de-envio__a-convenir">
					A coordinar con el vendedor
				</p>
				<p
				v-else
				class="checkout-option__price">
					{{ price(delivery_zone.price) }}
				</p>
			</div>
		</div>

		<!--
			Envío por correo (Zipnova). Si el comprador ya cotizó en el carrito con el mismo código
			postal, el cotizador muestra esas opciones sin volver a pedirlas (todo vive en el store).

			Con las direcciones de envío nuevas (19/10/2026) el código postal sale de la dirección
			elegida en "¿A dónde te lo enviamos?": sin dirección todavía, en lugar del cotizador se
			le dice que la elija primero.
		-->
		<template v-if="commerce.envios_zipnova">
			<p
			v-if="direcciones_de_envio_activas && !cart_direccion_envio"
			:class="{'formas-de-envio__cotizador--con-zonas': delivery_zones.length}"
			class="formas-de-envio__falta-direccion">
				<i class="bi bi-info-circle"></i>
				<span>
					Para ver los envíos por correo, primero
					<a
					href="#direccion-de-entrega"
					@click.prevent="scroll_a_seccion('direccion-de-entrega')">elegí a dónde te lo enviamos</a>.
				</span>
			</p>
			<cotizador-envio
			v-else
			:class="{'formas-de-envio__cotizador--con-zonas': delivery_zones.length}"
			:titulo="direcciones_de_envio_activas ? 'Envío por correo a tu dirección' : 'Envío por correo a tu código postal'"
			:direccion_envio="direcciones_de_envio_activas ? cart_direccion_envio : null"
			usar_carrito
			seleccionable></cotizador-envio>
		</template>
	</div>
</template>
<script>
import cart from '@/mixins/cart'
import CotizadorEnvio from '@/components/common/envio/Cotizador'
import { zona_a_convenir } from '@/helpers/direcciones'

/**
 * Formas de envío del checkout, en UNA sola lista: las zonas propias del negocio (si las tiene)
 * y, debajo, las opciones por correo cotizadas con Zipnova (si el comercio lo conectó). Zona y
 * opción de Zipnova nunca conviven: elegir una suelta la otra (mutaciones del store).
 *
 * Reemplaza a DeliveryZones.vue en el checkout desde el 14/9/2026 (ese archivo queda, sin montar).
 *
 * Formas propias "a convenir" (`delivery_zones.costo_a_convenir`, 19/10/2026): se muestran con
 * "A coordinar con el vendedor" en lugar del precio y no suman nada al total (`envio_precio_elegido`
 * del mixin). Ej.: "Acordar con el vendedor". Con una base sin la columna, todas cobran su precio.
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
			if (this.direcciones_de_envio_activas) {
				if (this.delivery_zones.length && this.commerce.envios_zipnova) {
					return 'Elegí el envío del negocio o uno de los correos que llegan a tu dirección.'
				}
				if (this.commerce.envios_zipnova) {
					return 'Estos son los correos que llegan a tu dirección, con el costo y los días de entrega.'
				}
				return 'Elegí cómo te lo enviamos.'
			}
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
		/**
		 * Si la forma propia es "a convenir" (no se cobra en la tienda).
		 *
		 * @param {object} delivery_zone
		 * @returns {boolean}
		 */
		es_a_convenir(delivery_zone) {
			return zona_a_convenir(delivery_zone)
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

// "A coordinar con el vendedor" en lugar del precio: puede partirse en dos renglones (en el
// teléfono un texto así sin cortar le saca todo el ancho al nombre de la forma).
.checkout-option__price.formas-de-envio__a-convenir
	white-space: normal
	max-width: 8.5rem
	text-align: right
	font-size: .82rem
	font-weight: 600
	line-height: 1.3
	color: rgba(0, 0, 0, .65)

.formas-de-envio__falta-direccion
	display: flex
	align-items: flex-start
	gap: .5rem
	font-size: .88rem
	color: rgba(0, 0, 0, .65)
	text-align: left
	margin-bottom: 0

	i
		color: var(--secondary-color, #0d6efd)
		margin-top: 2px

	a
		font-weight: 600
		color: var(--secondary-color, #0d6efd)
		text-decoration: underline
</style>
