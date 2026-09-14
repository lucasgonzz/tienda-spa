<template>
	<div
	v-if="mostrar"
	id="direccion-envio"
	class="checkout-section direccion-envio">
		<h2 class="checkout-section__title">
			<i class="bi bi-geo-alt"></i>
			{{ es_punto_de_retiro ? '¿Quién lo retira en la sucursal?' : '¿A dónde te lo enviamos?' }}
		</h2>
		<p class="checkout-section__hint">
			{{ es_punto_de_retiro ? 'El correo pide estos datos para entregarle el paquete a quien lo retire.' : 'El correo necesita la dirección completa y tus datos para entregarte el paquete.' }}
		</p>

		<!-- Retiro en sucursal: la sucursal elegida, y nada de calle/número/piso -->
		<div
		v-if="es_punto_de_retiro"
		class="direccion-envio__sucursal">
			<i class="bi bi-shop"></i>
			<div>
				<p class="direccion-envio__sucursal-nombre">
					{{ opcion.carrier_name }} · {{ sucursal ? sucursal.description : 'Sucursal a confirmar por el correo' }}
				</p>
				<p
				v-if="sucursal && texto_sucursal"
				class="direccion-envio__sucursal-direccion">
					{{ texto_sucursal }}
				</p>
			</div>
		</div>

		<div class="direccion-envio__fila">
			<div class="checkout-field">
				<label
				class="checkout-field__label"
				for="envio-nombre">Nombre</label>
				<b-form-input
				id="envio-nombre"
				v-model="nombre"
				:state="estado('nombre')"
				autocomplete="given-name"
				placeholder="Como figura en tu DNI"></b-form-input>
			</div>
			<div class="checkout-field">
				<label
				class="checkout-field__label"
				for="envio-apellido">Apellido</label>
				<b-form-input
				id="envio-apellido"
				v-model="apellido"
				:state="estado('apellido')"
				autocomplete="family-name"
				placeholder="Apellido"></b-form-input>
			</div>
		</div>

		<div class="direccion-envio__fila">
			<div class="checkout-field">
				<label
				class="checkout-field__label"
				for="envio-documento">DNI</label>
				<b-form-input
				id="envio-documento"
				v-model="documento"
				:state="estado('documento')"
				inputmode="numeric"
				autocomplete="off"
				maxlength="11"
				placeholder="Solo números"></b-form-input>
			</div>
			<div class="checkout-field">
				<label
				class="checkout-field__label"
				for="envio-telefono">Teléfono</label>
				<b-form-input
				id="envio-telefono"
				v-model="telefono"
				:state="estado('telefono')"
				type="tel"
				inputmode="tel"
				autocomplete="tel"
				placeholder="Con código de área. Ej: 3444622139"></b-form-input>
			</div>
		</div>

		<div class="checkout-field">
			<label
			class="checkout-field__label"
			for="envio-email">Email</label>
			<b-form-input
			id="envio-email"
			v-model="email"
			:state="estado('email')"
			type="email"
			inputmode="email"
			autocomplete="email"
			placeholder="tunombre@correo.com"></b-form-input>
		</div>

		<div
		v-if="!es_punto_de_retiro"
		class="direccion-envio__fila direccion-envio__fila--calle">
			<div class="checkout-field">
				<label
				class="checkout-field__label"
				for="envio-calle">Calle</label>
				<b-form-input
				id="envio-calle"
				v-model="calle"
				:state="estado('calle')"
				autocomplete="address-line1"
				placeholder="Calle o avenida"></b-form-input>
			</div>
			<div class="checkout-field">
				<label
				class="checkout-field__label"
				for="envio-numero">Número</label>
				<b-form-input
				id="envio-numero"
				v-model="numero"
				:state="estado('numero')"
				inputmode="numeric"
				placeholder="1234"
				@blur="geocodificar"></b-form-input>
			</div>
		</div>

		<div
		v-if="!es_punto_de_retiro"
		class="checkout-field">
			<label
			class="checkout-field__label"
			for="envio-piso">Piso / Depto <span class="direccion-envio__opcional">(opcional)</span></label>
			<b-form-input
			id="envio-piso"
			v-model="piso_depto"
			autocomplete="address-line2"
			placeholder="Ej: 4 B, casa del fondo"></b-form-input>
		</div>

		<div class="direccion-envio__fila">
			<div class="checkout-field">
				<label
				class="checkout-field__label"
				for="envio-localidad">Localidad</label>
				<b-form-input
				id="envio-localidad"
				v-model="localidad"
				:state="estado('localidad')"
				autocomplete="address-level2"
				placeholder="Localidad"></b-form-input>
			</div>
			<div class="checkout-field">
				<label
				class="checkout-field__label"
				for="envio-provincia">Provincia</label>
				<b-form-select
				id="envio-provincia"
				v-model="provincia"
				:state="estado('provincia')"
				:options="provincias_options"
				autocomplete="address-level1"></b-form-select>
			</div>
		</div>

		<div class="checkout-field">
			<label
			class="checkout-field__label"
			for="envio-cp">Código postal</label>
			<div class="direccion-envio__cp">
				<b-form-input
				id="envio-cp"
				:value="codigo_postal"
				readonly
				inputmode="numeric"
				autocomplete="postal-code"
				class="direccion-envio__cp-input"></b-form-input>
				<a
				href="#formas-de-envio"
				class="direccion-envio__cambiar"
				@click.prevent="cambiar_codigo_postal">
					cambiar
				</a>
			</div>
			<p class="checkout-field__hint m-t-5 m-b-0">
				Es el código postal con el que cotizaste el envío. Para cambiarlo, volvé a calcular.
			</p>
		</div>

		<div class="checkout-field">
			<label
			class="checkout-field__label"
			for="envio-referencia">{{ es_punto_de_retiro ? 'Algo que el correo tenga que saber' : 'Referencias para el repartidor' }} <span class="direccion-envio__opcional">(opcional)</span></label>
			<b-form-textarea
			id="envio-referencia"
			v-model="referencia"
			rows="2"
			max-rows="3"
			:placeholder="es_punto_de_retiro ? 'Ej: lo retira otra persona' : 'Ej: portón negro, timbre del fondo, dejar con el portero'"></b-form-textarea>
		</div>
	</div>
</template>
<script>
import cart from '@/mixins/cart'
import { PROVINCIAS } from '@/constants/provincias'

/**
 * Los campos del destino, para armar el par get/set contra el store sin repetir doce veces lo
 * mismo. Cada uno lee `cart.envio.destino[campo]` y escribe con `set_envio_destino_field`.
 */
const CAMPOS = [
	'nombre', 'apellido', 'documento', 'email', 'telefono',
	'calle', 'numero', 'piso_depto', 'localidad', 'provincia', 'codigo_postal', 'referencia',
]

/**
 * Arma la computed get/set de un campo del destino.
 *
 * @param {string} campo
 * @returns {object}
 */
function campo_del_destino(campo) {
	return {
		get() {
			let destino = this.$store.state.cart.envio.destino
			return destino && destino[campo] !== undefined && destino[campo] !== null ? destino[campo] : ''
		},
		set(value) {
			this.$store.commit('cart/set_envio_destino_field', { field: campo, value: value })
		},
	}
}

let computed_campos = {}
CAMPOS.forEach(campo => {
	computed_campos[campo] = campo_del_destino(campo)
})

/**
 * Formulario completo del destinatario y la dirección para el envío por correo (Zipnova). Aparece
 * en el checkout cuando el comprador eligió envío a domicilio y una opción de Zipnova; reemplaza
 * al input "Dirección" de una sola línea (que se esconde en ese caso).
 *
 * Pensado primero para el teléfono: una columna, inputs de 44px, teclado numérico donde va un
 * número. En 768px o más, los pares nombre/apellido, DNI/teléfono, calle/número y
 * localidad/provincia van de a dos.
 *
 * Todo el estado vive en el store (`cart.envio.destino`): el `PUT /api/carts` lo manda tal cual y
 * el servidor lo valida (422 `codigo: 'destino'` marca acá los campos rechazados).
 */
export default {
	name: 'DireccionEnvio',
	mixins: [cart],
	computed: Object.assign({
		/**
		 * Solo con envío a domicilio, Zipnova conectado y una opción de Zipnova elegida.
		 * @returns {boolean}
		 */
		mostrar() {
			return Number(this.deliver) === 1 && !!this.commerce.envios_zipnova && !!this.cart_envio_opcion
		},
		opcion() {
			return this.cart_envio_opcion
		},
		es_punto_de_retiro() {
			return !!(this.opcion && this.opcion.es_punto_de_retiro)
		},
		/**
		 * La sucursal elegida, si la opción es de retiro en sucursal.
		 * @returns {object|null}
		 */
		sucursal() {
			if (!this.es_punto_de_retiro || !this.envio.point_id || !this.opcion.puntos_de_retiro) {
				return null
			}
			let sucursal = this.opcion.puntos_de_retiro.find(punto => {
				return punto.point_id == this.envio.point_id
			})
			return sucursal ? sucursal : null
		},
		texto_sucursal() {
			if (!this.sucursal) {
				return ''
			}
			let partes = []
			let direccion = (this.sucursal.street + ' ' + this.sucursal.street_number).trim()
			if (direccion) {
				partes.push(direccion)
			}
			if (this.sucursal.city) {
				partes.push(this.sucursal.city)
			}
			let texto = partes.join(', ')
			if (this.sucursal.open_hours) {
				texto += (texto ? ' · ' : '') + this.sucursal.open_hours
			}
			return texto
		},
		provincias_options() {
			let options = [{ value: '', text: 'Elegí la provincia' }]
			PROVINCIAS.forEach(provincia => {
				options.push({ value: provincia, text: provincia })
			})
			return options
		},
		/** Datos del comprador invitado (Buyer.vue), para precargar. */
		cart_buyer() {
			return this.$store.state.cart.buyer
		},
	}, computed_campos),
	watch: {
		/**
		 * El invitado completa "¿Quién hace la compra?" arriba de este bloque: lo que escribe ahí
		 * se copia a los campos de acá que sigan vacíos, para no pedírselo dos veces.
		 */
		cart_buyer: {
			deep: true,
			handler() {
				this.precargar()
			},
		},
		user() {
			this.precargar()
		},
		mostrar(value) {
			if (value) {
				this.precargar()
			}
		},
	},
	created() {
		this.precargar()
	},
	methods: {
		/**
		 * Estado de validación de un campo para BootstrapVue: `false` (rojo) si el servidor lo
		 * rechazó en el último guardado, `null` (sin marcar) en cualquier otro caso.
		 *
		 * @param {string} campo
		 * @returns {boolean|null}
		 */
		estado(campo) {
			return this.envio.errores_destino.indexOf(campo) !== -1 ? false : null
		},
		/**
		 * Completa los campos VACÍOS con lo que ya se sabe del comprador: la sesión (`user`) o el
		 * formulario del invitado (`cart.buyer`), y el código postal del cotizador. Nunca pisa lo
		 * que el comprador escribió acá.
		 */
		precargar() {
			let origen = null
			if (this.user && this.user.seller_id) {
				// Un vendedor cargando el pedido de un cliente: el destinatario es el cliente.
				origen = this.selected_buyer ? this.selected_buyer : null
			} else if (this.user) {
				origen = this.user
			} else if (this.cart_buyer) {
				origen = this.cart_buyer
			}

			if (origen) {
				let nombre = origen.name ? String(origen.name).trim() : ''
				let apellido = origen.surname ? String(origen.surname).trim() : ''
				// Sin apellido propio, "Juan Pérez" se reparte: la primera palabra es el nombre.
				if (!apellido && nombre.indexOf(' ') !== -1) {
					let partes = nombre.split(/\s+/)
					nombre = partes.shift()
					apellido = partes.join(' ')
				}
				this.completar('nombre', nombre)
				this.completar('apellido', apellido)
				this.completar('email', origen.email)
				this.completar('telefono', origen.phone)
				this.completar('localidad', origen.ciudad)
			}

			this.completar('codigo_postal', this.envio.zipcode)
			this.completar('localidad', this.envio.city)
		},
		/**
		 * Setea un campo del destino solo si está vacío y hay algo con qué llenarlo.
		 *
		 * @param {string} campo
		 * @param {string} valor
		 */
		completar(campo, valor) {
			if (!valor) {
				return
			}
			let actual = this.$store.state.cart.envio.destino[campo]
			if (actual !== undefined && actual !== null && String(actual).trim() !== '') {
				return
			}
			this.$store.commit('cart/set_envio_destino_field', { field: campo, value: String(valor).trim() })
		},
		/**
		 * Vuelve al cotizador para cambiar el código postal (el CP de acá es de solo lectura:
		 * el envío se cotizó para ese destino).
		 */
		cambiar_codigo_postal() {
			this.scrollTo('formas-de-envio')
			setTimeout(() => {
				let input = document.querySelector('#formas-de-envio .envio-cotizador__input')
				if (input) {
					input.focus()
				}
			}, 400)
		},
		/**
		 * Geocodifica la dirección con Google Maps para completar lat/lng en silencio (ayuda al
		 * correo a ubicar el domicilio). Sin mapa, sin bloquear y sin avisar si falla o si Google
		 * no está cargado: la dirección en texto es lo que vale.
		 */
		geocodificar() {
			if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
				return
			}
			let calle = this.calle
			let numero = this.numero
			let localidad = this.localidad
			if (!calle || !numero || !localidad) {
				return
			}
			let self = this
			let direccion = calle + ' ' + numero + ', ' + localidad + (this.provincia ? ', ' + this.provincia : '') + ', Argentina'
			try {
				let geocoder = new window.google.maps.Geocoder()
				geocoder.geocode({ address: direccion }, function(results, status) {
					if (status !== 'OK' || !results || !results.length || !results[0].geometry) {
						return
					}
					// Si el comprador siguió editando mientras Google respondía, esa ubicación ya no es.
					if (calle !== self.calle || numero !== self.numero || localidad !== self.localidad) {
						return
					}
					let location = results[0].geometry.location
					self.$store.commit('cart/set_envio_destino_field', { field: 'lat', value: location.lat() })
					self.$store.commit('cart/set_envio_destino_field', { field: 'lng', value: location.lng() })
				})
			} catch (e) {
				// Google falló: queda la dirección en texto, que es lo que Zipnova usa.
			}
		},
	},
}
</script>
<style lang="sass">
// Formulario de destino del envío por correo. Una columna en el teléfono; pares desde 768px.
.direccion-envio__fila
	display: flex
	flex-direction: column

	@media screen and (min-width: 768px)
		flex-direction: row
		gap: .75rem

		> .checkout-field
			flex: 1 1 0
			min-width: 0

.direccion-envio__fila--calle
	@media screen and (min-width: 768px)
		> .checkout-field:first-child
			flex: 2 1 0

		> .checkout-field:last-child
			flex: 1 1 0

.direccion-envio .checkout-field
	margin-bottom: .75rem

.direccion-envio__opcional
	font-weight: 400
	text-transform: none

.direccion-envio__cp
	display: flex
	align-items: center
	gap: .75rem

.direccion-envio__cp-input
	max-width: 10rem
	background: #f5f5f5 !important

.direccion-envio__cambiar
	font-size: .9rem
	font-weight: 600
	color: var(--secondary-color, #0d6efd)
	text-decoration: underline
	white-space: nowrap
	// Que el link sea fácil de tocar en el teléfono.
	padding: .5rem .25rem

.direccion-envio__sucursal
	display: flex
	align-items: flex-start
	gap: .7rem
	padding: .8rem .9rem
	margin-bottom: .9rem
	border-radius: 12px
	background: color-mix(in srgb, var(--secondary-color, #0d6efd) 6%, #fff)
	border: 1px solid color-mix(in srgb, var(--secondary-color, #0d6efd) 35%, transparent)
	text-align: left

	i
		font-size: 1.3rem
		line-height: 1
		color: var(--secondary-color, #0d6efd)
		margin-top: 2px

.direccion-envio__sucursal-nombre
	font-size: .95rem
	font-weight: 600
	color: #1a1a1a
	margin: 0

.direccion-envio__sucursal-direccion
	font-size: .85rem
	color: rgba(0, 0, 0, .6)
	margin: .15rem 0 0
</style>
