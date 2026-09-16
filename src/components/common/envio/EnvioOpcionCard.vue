<template>
	<div
	class="envio-opcion"
	:class="{
		'checkout-option': seleccionable,
		'checkout-option--selected': seleccionable && elegida,
		'envio-opcion--fija': !seleccionable,
	}"
	:role="seleccionable ? 'radio' : null"
	:tabindex="seleccionable ? 0 : null"
	:aria-checked="seleccionable ? (elegida ? 'true' : 'false') : null"
	@click="$emit('click')"
	@keyup.enter="$emit('click')"
	@keyup.space.prevent="$emit('click')">

		<span
		v-if="seleccionable"
		class="checkout-option__radio"></span>

		<img
		v-if="opcion.carrier_logo"
		:src="opcion.carrier_logo"
		:alt="opcion.carrier_name"
		class="envio-opcion__logo"
		@error="ocultar_logo">

		<div class="envio-opcion__body">
			<p class="envio-opcion__nombre">
				{{ opcion.carrier_name }}
				<span class="envio-opcion__servicio">· {{ opcion.service_name }}</span>
			</p>
			<p
			v-if="texto_plazo"
			class="envio-opcion__plazo">
				{{ texto_plazo }}
			</p>
			<div
			v-if="chips.length"
			class="checkout-option__tags envio-opcion__chips">
				<span
				v-for="chip in chips"
				:key="chip"
				class="checkout-tag checkout-tag--good">
					{{ chip }}
				</span>
			</div>
		</div>

		<p
		class="envio-opcion__precio"
		:class="{'envio-opcion__precio--gratis': es_gratis}">
			{{ texto_precio }}
		</p>

		<!--
			Retiro en sucursal del correo: el comprador elige en cuál. Va después del precio
			y ocupa todo el ancho de la tarjeta (flex-wrap): adentro del cuerpo, en un
			teléfono, el select quedaba en 150px y no se leía el nombre de la sucursal.
		-->
		<div
		v-if="seleccionable && elegida && opcion.es_punto_de_retiro"
		class="envio-opcion__sucursales"
		@click.stop
		@keyup.stop>
			<label
			:for="'envio-sucursal-' + _uid"
			class="checkout-field__label">
				¿En qué sucursal lo retirás?
			</label>
			<b-form-select
			v-if="opcion.puntos_de_retiro && opcion.puntos_de_retiro.length"
			:id="'envio-sucursal-' + _uid"
			:value="point_id"
			@input="$emit('input', $event)"
			:options="opciones_sucursal"
			class="envio-cotizador__select"></b-form-select>
			<p
			v-else
			class="envio-cotizador__hint m-b-0">
				El correo te va a indicar la sucursal más cercana a tu código postal.
			</p>
		</div>
	</div>
</template>
<script>
/**
 * Una tarjeta de opción de envío (correo + servicio), tal como la devuelve
 * `ZipnovaQuoteNormalizer`. La usa `Cotizador.vue` en dos lugares con el mismo markup: la lista
 * elegible del checkout y la lista informativa del modal "Costos y tiempo de entrega" — separarla
 * evitó duplicar esta tarjeta dos veces adentro del mismo archivo.
 *
 * No toca el store: es puramente presentacional. `Cotizador.vue` sigue siendo el único que
 * escribe `cart/set_envio_*`, acá solo se emiten los eventos (`click`, `input` del punto de
 * retiro) para que el padre decida.
 */
export default {
	name: 'EnvioOpcionCard',
	props: {
		opcion: {
			type: Object,
			required: true,
		},
		/** Elegible (checkout) en vez de solo informativa (artículo, carrito, modal). */
		seleccionable: {
			type: Boolean,
			default: false,
		},
		elegida: {
			type: Boolean,
			default: false,
		},
		/** Sucursal elegida para esta opción, cuando es punto de retiro (v-model del padre). */
		point_id: {
			type: [String, Number],
			default: null,
		},
	},
	computed: {
		es_gratis() {
			return !!(this.opcion.envio_gratis || Number(this.opcion.precio) === 0)
		},
		/**
		 * Precio de la opción: "Gratis" o el importe. `price()` del mixin global devuelve "-" con
		 * cero, por eso el caso gratis va antes.
		 * @returns {string}
		 */
		texto_precio() {
			if (this.es_gratis) {
				return 'Gratis'
			}
			return this.price(this.opcion.precio)
		},
		/**
		 * "Llega en 3 a 5 días hábiles", "Llega en 2 días hábiles", "Llega en 1 día hábil" o, sin
		 * días, "Llega el 21/09".
		 * @returns {string}
		 */
		texto_plazo() {
			let min = this.opcion.dias_min
			let max = this.opcion.dias_max
			if (min !== null && min !== undefined && max !== null && max !== undefined) {
				min = Number(min)
				max = Number(max)
				if (min === max) {
					if (min === 1) {
						return 'Llega en 1 día hábil'
					}
					return 'Llega en ' + min + ' días hábiles'
				}
				return 'Llega en ' + min + ' a ' + max + ' días hábiles'
			}
			if (this.opcion.estimated_delivery) {
				let fecha = new Date(this.opcion.estimated_delivery)
				if (!isNaN(fecha.getTime())) {
					let dia = String(fecha.getDate()).padStart(2, '0')
					let mes = String(fecha.getMonth() + 1).padStart(2, '0')
					return 'Llega el ' + dia + '/' + mes
				}
			}
			return ''
		},
		/**
		 * Etiquetas de la opción a partir de los `tags` de Zipnova.
		 * @returns {string[]}
		 */
		chips() {
			let chips = []
			;(this.opcion.tags || []).forEach(tag => {
				if (tag == 'cheapest') {
					chips.push('Más barato')
				} else if (tag == 'fastest') {
					chips.push('Más rápido')
				}
			})
			return chips
		},
		/**
		 * Opciones del select de sucursales de esta opción.
		 * @returns {Array}
		 */
		opciones_sucursal() {
			let options = [{ value: null, text: 'Elegí la sucursal' }]
			;(this.opcion.puntos_de_retiro || []).forEach(punto => {
				let direccion = (punto.street + ' ' + punto.street_number).trim()
				let texto = punto.description
				if (direccion) {
					texto += ' — ' + direccion
				}
				if (punto.city) {
					texto += ', ' + punto.city
				}
				if (punto.open_hours) {
					texto += ' (' + punto.open_hours + ')'
				}
				options.push({ value: punto.point_id, text: texto })
			})
			return options
		},
	},
	methods: {
		/**
		 * El logo del correo no cargó: se esconde y queda el nombre, que siempre está.
		 * @param {Event} event
		 */
		ocultar_logo(event) {
			if (event && event.target) {
				event.target.style.display = 'none'
			}
		},
	},
}
</script>
<style lang="sass" scoped>
// Una opción (correo + servicio). En el checkout lleva además .checkout-option (tarjeta elegible,
// definida en el CSS del checkout — no scopeada acá, sigue aplicando igual).
.envio-opcion
	display: flex
	flex-wrap: wrap
	align-items: flex-start
	gap: .7rem

.envio-opcion--fija
	padding: .65rem 0
	border-top: 1px solid rgba(0, 0, 0, .08)

	&:last-child
		border-bottom: 1px solid rgba(0, 0, 0, .08)

.envio-opcion__logo
	flex: 0 0 auto
	width: 40px
	height: 28px
	object-fit: contain
	margin-top: 2px

// Base 0: con flex-wrap en la tarjeta, un nombre largo no manda el precio a la línea de abajo.
.envio-opcion__body
	flex: 1 1 0%
	min-width: 0

.envio-opcion__nombre
	font-size: .95rem
	font-weight: 600
	color: #1a1a1a
	margin: 0
	line-height: 1.35

.envio-opcion__servicio
	font-weight: 400
	color: rgba(0, 0, 0, .6)

.envio-opcion__plazo
	font-size: .84rem
	color: rgba(0, 0, 0, .6)
	margin: .15rem 0 0

.envio-opcion__chips
	margin-top: .35rem

.envio-opcion__precio
	flex: 0 0 auto
	font-size: .98rem
	font-weight: 700
	color: #1a1a1a
	white-space: nowrap
	margin: 0
	padding-left: .4rem

.envio-opcion__precio--gratis
	color: #1b7a3d

// Ocupa el ancho entero de la tarjeta, alineado con el cuerpo (después del radio y su gap).
.envio-opcion__sucursales
	flex: 0 0 100%
	margin-top: .2rem
	padding-left: calc(20px + .8rem)
	cursor: default

	.checkout-field__label
		margin-bottom: .35rem

	@media screen and (max-width: 767px)
		padding-left: 0
</style>
