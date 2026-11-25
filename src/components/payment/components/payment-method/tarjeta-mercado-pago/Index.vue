<template>
	<!--
		Pago con tarjeta DENTRO de la tienda (método de tipo «Tarjeta Mercado Pago»). Orquestador: sólo arma el
		layout y registra los sub-componentes.

		Orden: primero se eligen las cuotas (los valores los calculó el servidor) y abajo está el formulario
		seguro de Mercado Pago. El botón de pagar es el de siempre (BtnSave.vue).

		Sin las opciones del servidor (API vieja o falla) no hay forma de pagar con tarjeta: se avisa y se
		deja elegir otro medio de pago.
	-->
	<div class="checkout-cuotas">

		<p
		v-if="no_disponible"
		class="checkout-cuotas__hint"
		role="alert">
			El pago con tarjeta no está disponible en este momento. Elegí otro medio de pago.
		</p>

		<p
		v-else-if="!opciones.length"
		class="checkout-cuotas__hint"
		role="status">
			Calculando las cuotas...
		</p>

		<template v-else>
			<selector-de-cuotas
			:opciones="opciones"
			:elegida="cuotas_elegidas"
			:bloqueado="bloqueado"
			@elegir="elegir"></selector-de-cuotas>

			<formulario-de-tarjeta
			:public_key="payment_method.public_key"
			:amount="monto_inicial"
			:email="email_del_comprador"></formulario-de-tarjeta>
		</template>
	</div>
</template>
<script>
import SelectorDeCuotas from './SelectorDeCuotas'
import FormularioDeTarjeta from './FormularioDeTarjeta'

/**
 * Orquestador del pago con tarjeta en la página.
 *
 * Al montarse (o sea, cuando el comprador elige este método) guarda el carrito y le pide al servidor los montos
 * por cantidad de cuotas. Todo el estado vive en `state.cart.tarjeta_mp`, que también leen el botón de pagar y
 * el resumen del total.
 */
export default {
	name: 'TarjetaMercadoPago',
	components: { SelectorDeCuotas, FormularioDeTarjeta },
	props: {
		// El método de pago elegido, tal como viene de la lista pública (con `public_key`).
		payment_method: { type: Object, required: true },
	},
	computed: {
		/**
		 * Opciones que calculó el servidor: [{cuotas, valor_cuota, total}].
		 *
		 * @returns {Array}
		 */
		opciones() {
			return this.$store.state.cart.tarjeta_mp.opciones
		},
		/**
		 * Cantidad de cuotas elegida (1 = un pago).
		 *
		 * @returns {number}
		 */
		cuotas_elegidas() {
			return this.$store.state.cart.tarjeta_mp.cuotas
		},
		/**
		 * Si la API no ofrece el pago con tarjeta (no tiene el endpoint o falló).
		 *
		 * @returns {boolean}
		 */
		no_disponible() {
			return this.$store.state.cart.tarjeta_mp.no_disponible
		},
		/**
		 * Mientras el botón de pagar trabaja, el selector queda congelado (la misma bandera que usa el de Checkout Pro).
		 *
		 * @returns {boolean}
		 */
		bloqueado() {
			return this.$store.state.cart.cuotas_bloqueadas
		},
		/**
		 * Monto con el que se inicializa el formulario: el de 1 pago. Es sólo informativo para Mercado Pago; lo que se
		 * cobra lo decide el servidor con la opción elegida.
		 *
		 * @returns {number}
		 */
		monto_inicial() {
			let un_pago = this.opciones.filter(o => o.cuotas === 1)
			return Number((un_pago.length ? un_pago[0] : this.opciones[0]).total)
		},
		/**
		 * Email del comprador para el formulario: el de la sesión o, si es invitado, el que cargó en el checkout.
		 *
		 * @returns {string}
		 */
		email_del_comprador() {
			let usuario = this.$store.state.auth.user
			if (usuario && usuario.email) {
				return usuario.email
			}
			return this.$store.state.cart.buyer.email || ''
		},
	},
	created() {
		this.cargar_montos()
	},
	methods: {
		/**
		 * Guarda el carrito (el servidor calcula sobre lo guardado) y pide los montos.
		 *
		 * @returns {Promise<void>}
		 */
		cargar_montos() {
			let self = this
			return this.$store.dispatch('cart/save', { avisar_no_disponibles: false })
			.then(function() {
				return self.$store.dispatch('cart/cargar_montos_de_tarjeta')
			})
			.catch(function() {
				self.$store.commit('cart/set_tarjeta_no_disponible', true)
			})
		},
		/**
		 * El comprador eligió una cantidad de cuotas.
		 *
		 * @param {number} cuotas
		 * @returns {void}
		 */
		elegir(cuotas) {
			this.$store.commit('cart/set_cuotas_de_tarjeta', cuotas)
		},
	},
}
</script>
