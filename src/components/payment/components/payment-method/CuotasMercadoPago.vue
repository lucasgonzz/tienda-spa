<template>
	<!--
		Sin cuotas que ofrecer (forma de pago sin vínculo o sin cuotas cargadas en el ERP, o una
		tienda-api vieja que no manda `cuotas_disponibles`) no se dibuja nada: el checkout queda
		exactamente como estaba.
	-->
	<div
	v-if="cuotas_mp_ofrecidas.length"
	:class="{'checkout-cuotas--bloqueado': bloqueado}"
	class="checkout-cuotas">

		<p
		id="checkout-cuotas-titulo"
		class="checkout-cuotas__title">
			¿Contado o en cuotas?
		</p>

		<p class="checkout-cuotas__hint">
			Las cuotas se pagan con tarjeta de crédito en Mercado Pago.
		</p>

		<div
		role="radiogroup"
		aria-labelledby="checkout-cuotas-titulo">

			<!-- Contado: el mismo precio que se paga hoy, y sin tarjeta de crédito. -->
			<div
			@click="elegir('contado')"
			@keydown.space.prevent
			@keyup.enter="elegir('contado')"
			@keyup.space.prevent="elegir('contado')"
			:class="{'checkout-option--selected': es_elegida('contado')}"
			class="checkout-option checkout-option--cuotas-contado"
			role="radio"
			:tabindex="bloqueado ? -1 : 0"
			:aria-disabled="bloqueado ? 'true' : 'false'"
			:aria-checked="es_elegida('contado') ? 'true' : 'false'">

				<span class="checkout-option__radio"></span>

				<div class="checkout-option__body">
					<p class="checkout-option__name">
						Contado
					</p>
					<p class="checkout-option__description">
						Débito, dinero en tu cuenta de Mercado Pago y otros medios (sin tarjeta de crédito)
					</p>
				</div>

				<p class="checkout-option__price">
					{{ price(total_with_deliver) }}
				</p>
			</div>

			<!--
				El título es el valor de CADA cuota (con el recargo ya puesto), no el total con recargo:
				ese va abajo, en chico, como "Total financiado".
			-->
			<div
			v-for="opcion in opciones"
			:key="'cuotas-' + opcion.cantidad_cuotas"
			@click="elegir(opcion.cantidad_cuotas)"
			@keydown.space.prevent
			@keyup.enter="elegir(opcion.cantidad_cuotas)"
			@keyup.space.prevent="elegir(opcion.cantidad_cuotas)"
			:class="{'checkout-option--selected': es_elegida(opcion.cantidad_cuotas)}"
			class="checkout-option checkout-option--cuotas"
			role="radio"
			:tabindex="bloqueado ? -1 : 0"
			:aria-disabled="bloqueado ? 'true' : 'false'"
			:aria-checked="es_elegida(opcion.cantidad_cuotas) ? 'true' : 'false'">

				<span class="checkout-option__radio"></span>

				<div class="checkout-option__body">
					<p class="checkout-option__name">
						{{ opcion.cantidad_cuotas }} {{ opcion.cantidad_cuotas === 1 ? 'cuota' : 'cuotas' }} de {{ price(opcion.valor_cuota) }}
					</p>
					<p
					v-if="opcion.recargo_monto > 0"
					class="checkout-option__description">
						Total financiado: {{ price(opcion.total_cobrado) }}
					</p>
					<p
					v-else
					class="checkout-option__description checkout-option__description--good">
						Sin recargo
					</p>
				</div>
			</div>
		</div>
	</div>
</template>
<script>
import cart from '@/mixins/cart'
import { calcular_cuota } from '@/store/cart'

/**
 * Selector «Contado / N cuotas» que aparece bajo la forma de pago de Mercado Pago cuando está
 * elegida y la API le ofrece cuotas (`cuotas_disponibles`, ver cuotas_ofrecidas() en el store).
 *
 * Todo lo que se muestra acá es INFORMATIVO. Lo que se cobra lo resuelve tienda-api con el
 * porcentaje que lee de su base: la SPA solo manda QUÉ eligió el comprador (`contado: true` o
 * `cuotas: N`, ver BtnSave.vue) y nunca un porcentaje ni un monto.
 *
 * La cuenta de pantalla sale de `total_with_deliver` del mixin del carrito, que ya incluye el
 * ajuste propio de la forma de pago y el envío, o sea lo mismo que la API toma como base. El resumen
 * del pedido (Total.vue) NO cambia a propósito: no muestra el total con recargo como titular, el
 * valor de cada cuota se ve acá.
 *
 * 🔴 Con Checkout Pro Mercado Pago no deja forzar el medio: en «N cuotas» el comprador igual puede
 * terminar pagando en menos cuotas o con dinero en cuenta, al mismo total ya recargado. Los textos
 * de acá no prometen más que «las cuotas se pagan con tarjeta de crédito en Mercado Pago».
 */
export default {
	name: 'CuotasMercadoPago',
	mixins: [cart],
	computed: {
		/**
		 * Si el selector está congelado: el botón de confirmar está trabajando y lo elegido ya viajó
		 * (o está por viajar) a Mercado Pago. Ver `cuotas_bloqueadas` en el store.
		 *
		 * @returns {boolean}
		 */
		bloqueado() {
			return this.$store.state.cart.cuotas_bloqueadas
		},
		/**
		 * Cada cuota ofrecida con su valor y el total financiado calculados sobre lo que el
		 * comprador pagaría hoy.
		 *
		 * @returns {Array}
		 */
		opciones() {
			let base = this.total_with_deliver
			return this.cuotas_mp_ofrecidas.map(fila => {
				return calcular_cuota(base, fila)
			})
		},
	},
	methods: {
		/**
		 * Si esta opción es la que tiene elegida el comprador.
		 *
		 * @param {string|number} clave 'contado' o la cantidad de cuotas.
		 * @returns {boolean}
		 */
		es_elegida(clave) {
			return this.cuotas_mp_elegida === clave
		},
		/**
		 * Elige «Contado» o una cantidad de cuotas. No manda ningún request: igual que elegir la
		 * forma de pago, el botón del final del checkout es el que confirma.
		 *
		 * @param {string|number} clave 'contado' o la cantidad de cuotas.
		 */
		elegir(clave) {
			if (this.bloqueado || this.es_elegida(clave)) {
				return
			}
			this.$store.commit('cart/set_cuotas_elegidas', clave)
		},
	},
}
</script>
