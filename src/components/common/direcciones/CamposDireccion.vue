<template>
	<div class="campos-direccion">
		<div
		v-if="muestra('street') || muestra('street_number')"
		class="campos-direccion__fila campos-direccion__fila--calle">
			<div
			v-if="muestra('street')"
			class="checkout-field">
				<label
				class="checkout-field__label"
				:for="id_base + '-street'">Calle</label>
				<b-form-input
				:id="id_base + '-street'"
				:value="value.street"
				:state="estado('street')"
				maxlength="160"
				autocomplete="address-line1"
				placeholder="Calle o avenida"
				@input="actualizar('street', $event)"></b-form-input>
			</div>
			<div
			v-if="muestra('street_number')"
			class="checkout-field">
				<label
				class="checkout-field__label"
				:for="id_base + '-street_number'">Altura</label>
				<b-form-input
				:id="id_base + '-street_number'"
				:value="value.street_number"
				:state="estado('street_number')"
				inputmode="numeric"
				maxlength="20"
				autocomplete="off"
				placeholder="Ej: 1234"
				@input="actualizar('street_number', $event)"></b-form-input>
			</div>
		</div>

		<div
		v-if="muestra('apartment') || muestra('zip_code')"
		class="campos-direccion__fila">
			<div
			v-if="muestra('apartment')"
			class="checkout-field">
				<label
				class="checkout-field__label"
				:for="id_base + '-apartment'">Piso / depto <span class="campos-direccion__opcional">(opcional)</span></label>
				<b-form-input
				:id="id_base + '-apartment'"
				:value="value.apartment"
				maxlength="60"
				autocomplete="address-line2"
				placeholder="Ej: 4 B, casa del fondo"
				@input="actualizar('apartment', $event)"></b-form-input>
			</div>
			<div
			v-if="muestra('zip_code')"
			class="checkout-field">
				<label
				class="checkout-field__label"
				:for="id_base + '-zip_code'">Código postal <span
				v-if="!es_requerido('zip_code')"
				class="campos-direccion__opcional">(opcional)</span></label>
				<b-form-input
				:id="id_base + '-zip_code'"
				:value="value.zip_code"
				:state="estado('zip_code')"
				inputmode="numeric"
				maxlength="20"
				autocomplete="postal-code"
				placeholder="Ej: 2000"
				@input="actualizar('zip_code', $event)"></b-form-input>
			</div>
		</div>

		<div
		v-if="muestra('city') || muestra('province')"
		class="campos-direccion__fila">
			<div
			v-if="muestra('city')"
			class="checkout-field">
				<label
				class="checkout-field__label"
				:for="id_base + '-city'">Localidad</label>
				<b-form-input
				:id="id_base + '-city'"
				:value="value.city"
				:state="estado('city')"
				maxlength="120"
				autocomplete="address-level2"
				placeholder="Localidad"
				@input="actualizar('city', $event)"></b-form-input>
			</div>
			<div
			v-if="muestra('province')"
			class="checkout-field">
				<label
				class="checkout-field__label"
				:for="id_base + '-province'">Provincia</label>
				<b-form-select
				:id="id_base + '-province'"
				:value="value.province"
				:state="estado('province')"
				:options="provincias_options"
				autocomplete="address-level1"
				@input="actualizar('province', $event)"></b-form-select>
			</div>
		</div>

		<div
		v-if="muestra('reference')"
		class="checkout-field">
			<label
			class="checkout-field__label"
			:for="id_base + '-reference'">Referencia <span class="campos-direccion__opcional">(opcional)</span></label>
			<b-form-input
			:id="id_base + '-reference'"
			:value="value.reference"
			maxlength="255"
			autocomplete="off"
			placeholder="Entre calles, timbre, portón negro..."
			@input="actualizar('reference', $event)"></b-form-input>
		</div>
	</div>
</template>
<script>
import { PROVINCIAS } from '@/constants/provincias'

/**
 * Los campos de una dirección para completar a mano (misión formas-envio-direcciones-maps,
 * 19/10/2026). Los usa el buscador en sus dos modos:
 *
 *   - completar lo que Google no trajo de la dirección elegida (altura, código postal) y lo que
 *     Google nunca sabe (piso/depto, referencia);
 *   - la carga entera a mano, cuando Google no está, falla (hoy, sin facturación, falla siempre)
 *     o el comprador no encuentra su dirección.
 *
 * No tiene estado propio: recibe la dirección en `value` y emite `input` con una copia que tiene
 * el campo cambiado (v-model del padre).
 *
 * Una columna en el teléfono, de a pares desde 768px, inputs de 44px de alto (los estilos de
 * `.checkout-section .form-control` y los de `.direcciones` en Index.vue).
 */
export default {
	name: 'CamposDireccion',
	props: {
		/** La dirección (forma del contrato). */
		value: {
			type: Object,
			required: true,
		},
		/** Qué campos mostrar (claves del contrato). */
		campos: {
			type: Array,
			default: () => [],
		},
		/** Cuáles son obligatorios (los demás dicen "(opcional)"). */
		requeridos: {
			type: Array,
			default: () => [],
		},
		/** Los que faltan y ya se le marcaron al comprador (borde rojo). */
		errores: {
			type: Array,
			default: () => [],
		},
		/** Prefijo de los ids de los inputs, único en la página (labels y foco). */
		id_base: {
			type: String,
			required: true,
		},
	},
	computed: {
		/**
		 * Las 24 jurisdicciones, más la que trae la dirección si no es ninguna de ellas (un nombre
		 * de Google que no se pudo reconocer): sin esa opción el select se vería vacío.
		 *
		 * @returns {Array}
		 */
		provincias_options() {
			let options = [{ value: '', text: 'Elegí la provincia' }]
			let actual = this.value.province
			if (actual && PROVINCIAS.indexOf(actual) === -1) {
				options.push({ value: actual, text: actual })
			}
			PROVINCIAS.forEach(provincia => {
				options.push({ value: provincia, text: provincia })
			})
			return options
		},
	},
	methods: {
		muestra(campo) {
			return this.campos.indexOf(campo) !== -1
		},
		es_requerido(campo) {
			return this.requeridos.indexOf(campo) !== -1
		},
		/**
		 * Estado para BootstrapVue: rojo si falta, sin marcar en cualquier otro caso.
		 *
		 * @param {string} campo
		 * @returns {boolean|null}
		 */
		estado(campo) {
			return this.errores.indexOf(campo) !== -1 ? false : null
		},
		/**
		 * Emite la dirección con un campo cambiado (copia: el padre es el dueño del objeto).
		 *
		 * @param {string} campo
		 * @param {string} valor
		 */
		actualizar(campo, valor) {
			let nueva = Object.assign({}, this.value)
			nueva[campo] = valor
			this.$emit('input', nueva)
		},
	},
}
</script>
<style lang="sass">
// Campos de una dirección. Una columna en el teléfono; pares desde 768px.
.campos-direccion__fila
	display: flex
	flex-direction: column

	@media screen and (min-width: 768px)
		flex-direction: row
		gap: .75rem

		> .checkout-field
			flex: 1 1 0
			min-width: 0

.campos-direccion__fila--calle
	@media screen and (min-width: 768px)
		> .checkout-field:first-child
			flex: 2 1 0

.campos-direccion .checkout-field
	margin-bottom: .75rem

.campos-direccion__opcional
	font-weight: 400
	text-transform: none
</style>
