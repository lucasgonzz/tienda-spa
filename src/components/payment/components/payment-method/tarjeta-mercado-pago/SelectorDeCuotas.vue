<template>
	<!--
		«1 pago de $X» / «N cuotas de $X». Sólo el valor de cada cuota: nunca el total financiado (regla de negocio 6).
		Los números vienen del servidor; acá no se calcula nada. Mismo patrón accesible que el selector de Checkout Pro
		(CuotasMercadoPago.vue): radiogroup, teclado y bloqueo mientras se paga.
	-->
	<div
	:class="{'checkout-cuotas--bloqueado': bloqueado}"
	role="radiogroup"
	aria-label="Cantidad de cuotas">

		<div
		v-for="opcion in opciones"
		:key="'tarjeta-cuotas-' + opcion.cuotas"
		@click="elegir(opcion.cuotas)"
		@keydown.space.prevent
		@keyup.enter="elegir(opcion.cuotas)"
		@keyup.space.prevent="elegir(opcion.cuotas)"
		:class="{'checkout-option--selected': es_elegida(opcion.cuotas)}"
		class="checkout-option checkout-option--cuotas"
		role="radio"
		:tabindex="bloqueado ? -1 : 0"
		:aria-disabled="bloqueado ? 'true' : 'false'"
		:aria-checked="es_elegida(opcion.cuotas) ? 'true' : 'false'">

			<span class="checkout-option__radio"></span>

			<div class="checkout-option__body">
				<p class="checkout-option__name">
					{{ opcion.cuotas === 1 ? '1 pago' : opcion.cuotas + ' cuotas' }} de {{ price(opcion.valor_cuota) }}
				</p>
			</div>
		</div>
	</div>
</template>
<script>
/**
 * Selector de cuotas del pago con tarjeta. Presentacional: recibe las opciones y avisa la elección.
 */
export default {
	name: 'SelectorDeCuotas',
	props: {
		// Opciones del servidor: [{cuotas, valor_cuota, total}].
		opciones: { type: Array, required: true },
		// Cantidad de cuotas elegida.
		elegida: { type: Number, default: 1 },
		// Si el selector está congelado (se está pagando).
		bloqueado: { type: Boolean, default: false },
	},
	methods: {
		/**
		 * Si esa cantidad de cuotas es la elegida.
		 *
		 * @param {number} cuotas
		 * @returns {boolean}
		 */
		es_elegida(cuotas) {
			return this.elegida === cuotas
		},
		/**
		 * Emite la elección, salvo que esté congelado o ya sea la elegida.
		 *
		 * @param {number} cuotas
		 * @returns {void}
		 */
		elegir(cuotas) {
			if (this.bloqueado || this.es_elegida(cuotas)) {
				return
			}
			this.$emit('elegir', cuotas)
		},
	},
}
</script>
