<template>
	<div
	v-if="mostrar"
	id="direccion-de-entrega"
	class="checkout-section">
		<h2 class="checkout-section__title">
			<i class="bi bi-geo-alt"></i>
			¿A dónde te lo enviamos?
		</h2>
		<p class="checkout-section__hint">
			{{ hint }}
		</p>

		<direcciones
		v-model="direccion"
		modo="checkout"
		:guardar_en_la_cuenta="es_comprador_logueado"
		:pide_codigo_postal="!!commerce.envios_zipnova"></direcciones>
	</div>
</template>
<script>
import cart from '@/mixins/cart'
import Direcciones from '@/components/common/direcciones/Index'

/**
 * Bloque "¿A dónde te lo enviamos?" del checkout (misión formas-envio-direcciones-maps,
 * 19/10/2026). Va ANTES de las formas de envío: con la dirección elegida se cotiza el correo
 * (Zipnova toma su código postal, el comprador no lo vuelve a escribir) y se arma el destino.
 *
 * Solo con `commerce.direcciones_de_envio` (si no, Payment.vue monta Addresses.vue, el input de
 * texto libre de siempre) y con envío a domicilio.
 *
 *   - Comprador logueado: sus direcciones guardadas como opciones (la principal elegida sola) y
 *     "Agregar otra dirección" con el buscador de Google; lo que agrega se guarda en su cuenta.
 *   - Invitado, o vendedor cargando el pedido de un cliente: el buscador para una sola dirección,
 *     que va en el carrito y no se guarda en ninguna lista.
 *
 * La dirección elegida vive en el store del carrito (`cart.direccion_envio`) y viaja en el
 * `PUT/POST /api/carts` como `direccion_envio` (ver `payload_direccion_envio` en store/cart.js).
 */
export default {
	name: 'DireccionDeEntrega',
	mixins: [cart],
	components: {
		Direcciones,
	},
	computed: {
		mostrar() {
			return this.direcciones_de_envio_activas && Number(this.deliver) === 1
		},
		/**
		 * Un comprador con cuenta que compra para sí mismo: el único que tiene lista de
		 * direcciones. El vendedor (`seller_id`) carga pedidos de clientes y el invitado no tiene
		 * cuenta (su `user` existe recién después de identificarse, y `authenticated` sigue false).
		 *
		 * @returns {boolean}
		 */
		es_comprador_logueado() {
			return !!(this.authenticated && this.user && !this.user.seller_id)
		},
		direccion: {
			get() {
				return this.$store.state.cart.direccion_envio
			},
			set(value) {
				this.$store.commit('cart/set_direccion_envio', value)
			},
		},
		hint() {
			if (this.commerce.envios_zipnova) {
				return 'Con tu dirección te mostramos los envíos que llegan, el costo y los días de entrega.'
			}
			return 'Elegí o cargá la dirección donde recibís el pedido.'
		},
	},
}
</script>
