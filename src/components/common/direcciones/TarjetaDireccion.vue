<template>
	<div
	:class="{
		'checkout-option--selected': elegida,
		'tarjeta-direccion--fija': !seleccionable,
	}"
	class="checkout-option tarjeta-direccion"
	:role="seleccionable ? 'radio' : null"
	:tabindex="seleccionable ? 0 : null"
	:aria-checked="seleccionable ? (elegida ? 'true' : 'false') : null"
	@click="elegir"
	@keyup.enter="elegir"
	@keyup.space.prevent="elegir">

		<span
		v-if="seleccionable"
		class="checkout-option__radio"></span>
		<i
		v-else
		class="bi bi-geo-alt checkout-option__icon"
		aria-hidden="true"></i>

		<div class="checkout-option__body">
			<p class="checkout-option__name tarjeta-direccion__calle">
				{{ renglon_calle }}
				<span
				v-if="direccion.is_default"
				class="tarjeta-direccion__principal">Principal</span>
			</p>
			<p
			v-if="renglon_localidad"
			class="checkout-option__description">
				{{ renglon_localidad }}
			</p>
			<p
			v-if="direccion.reference"
			class="checkout-option__description tarjeta-direccion__referencia">
				Referencia: {{ direccion.reference }}
			</p>

			<div
			v-if="tiene_acciones"
			class="tarjeta-direccion__acciones"
			@click.stop
			@keyup.stop>
				<slot name="acciones"></slot>
			</div>
		</div>
	</div>
</template>
<script>
import { renglon_de_la_calle, renglon_de_la_localidad } from '@/helpers/direcciones'

/**
 * Una dirección en una tarjeta (misión formas-envio-direcciones-maps, 19/10/2026): arriba la
 * calle, la altura y el piso/depto; abajo la localidad, la provincia y el código postal; y la
 * referencia si la tiene. Con el mismo estilo que las demás opciones del checkout
 * (`.checkout-option`).
 *
 * `seleccionable`: es una opción del checkout (radio, elegible con el dedo o el teclado) y emite
 * `elegir`. Si no, es solo para mostrar ("Mis direcciones", o la dirección ya elegida del
 * invitado), con un pin en lugar del radio.
 *
 * El slot `acciones` es para los botones de "Mis direcciones" (hacer principal, borrar). Sus
 * clicks no llegan a la tarjeta.
 */
export default {
	name: 'TarjetaDireccion',
	props: {
		direccion: {
			type: Object,
			required: true,
		},
		seleccionable: {
			type: Boolean,
			default: false,
		},
		elegida: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		renglon_calle() {
			return renglon_de_la_calle(this.direccion)
		},
		renglon_localidad() {
			return renglon_de_la_localidad(this.direccion)
		},
		tiene_acciones() {
			return !!(this.$scopedSlots.acciones || this.$slots.acciones)
		},
	},
	methods: {
		elegir() {
			if (this.seleccionable) {
				this.$emit('elegir')
			}
		},
	},
}
</script>
<style lang="sass">
.tarjeta-direccion__calle
	overflow-wrap: anywhere

.tarjeta-direccion--fija
	cursor: default

	&:hover
		border-color: rgba(0, 0, 0, .14)

.tarjeta-direccion__principal
	display: inline-block
	font-size: .72rem
	font-weight: 700
	text-transform: uppercase
	letter-spacing: .02em
	color: #1b7a3d
	background: rgba(27, 122, 61, .12)
	border-radius: 999px
	padding: .12rem .55rem

.tarjeta-direccion__referencia
	overflow-wrap: anywhere

.tarjeta-direccion__acciones
	display: flex
	flex-wrap: wrap
	gap: .5rem
	margin-top: .6rem
</style>
