<template>
	<!--
		Leyenda «Con Transferencia o Efectivo, 10 % de descuento». No dibuja nada si la casilla del comercio está
		apagada, si ningún método tiene descuento o si los precios están ocultos para este visitante.
	-->
	<p
	v-if="texto"
	:class="'leyenda-descuento leyenda-descuento--' + variante">
		{{ texto }}
	</p>
</template>
<script>
import { leyenda_descuento } from '@/utils/leyenda_descuento'

/**
 * Leyenda de descuento por medio de pago, en tres lugares: debajo del precio en la tarjeta del listado
 * (`tarjeta`), en la ficha del producto (`ficha`) y como franja arriba del sitio (`sitio`).
 */
export default {
	name: 'LeyendaDescuento',
	props: {
		// Dónde se muestra: 'tarjeta' | 'ficha' | 'sitio'. Sólo cambia el estilo.
		variante: { type: String, default: 'tarjeta' },
	},
	computed: {
		/**
		 * El texto de la leyenda, o '' si no corresponde mostrarla.
		 *
		 * @returns {string}
		 */
		texto() {
			if (!this.puede_ver_precios()) {
				return ''
			}
			let configuracion = this.commerce && this.commerce.online_configuration
			return leyenda_descuento(
				this.$store.state.payment_methods.models,
				configuracion && configuracion.mostrar_leyenda_de_descuento
			)
		},
	},
}
</script>
<style lang="sass">
.leyenda-descuento
	margin: 0
	line-height: 1.3

// Tarjeta del listado: renglón gris chico debajo del precio, como la oferta por cantidad.
.leyenda-descuento--tarjeta
	margin-top: .25rem
	font-size: .75rem
	color: #6c757d

// Ficha del producto: un poco más grande, debajo del precio.
.leyenda-descuento--ficha
	margin-top: .5rem
	font-size: .9rem
	color: #00A650

// Franja fina arriba del sitio (dentro del contenedor fijo del navbar): no se superpone con el navbar.
.leyenda-descuento--sitio
	padding: .2rem .75rem
	font-size: .8rem
	text-align: center
	color: #fff
	background: #111
</style>
