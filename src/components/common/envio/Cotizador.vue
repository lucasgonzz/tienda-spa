<template>
	<div
	class="envio-cotizador"
	:class="{'envio-cotizador--seleccionable': seleccionable}">

		<!-- Es un <label> y no un <p>: apunta al input del CP (el id lleva _uid porque el pie del
		     carrito monta este componente dos veces y los ids tienen que ser únicos). -->
		<label
		:for="'envio-cp-' + _uid"
		class="envio-cotizador__label">
			<i class="bi bi-truck"></i>
			{{ titulo }}
		</label>

		<p
		v-if="hint_envio_gratis"
		class="envio-cotizador__hint">
			{{ hint_envio_gratis }}
		</p>

		<!-- Código postal + Calcular. `form` para que Enter también cotice, en el teléfono sobre todo. -->
		<form
		class="envio-cotizador__form"
		@submit.prevent="cotizar">
			<b-form-input
			:id="'envio-cp-' + _uid"
			v-model="zipcode"
			inputmode="numeric"
			autocomplete="postal-code"
			maxlength="8"
			placeholder="Tu código postal"
			:disabled="cotizando"
			class="envio-cotizador__input"></b-form-input>

			<b-button
			type="submit"
			:disabled="!puede_cotizar"
			class="envio-cotizador__btn">
				<b-spinner
				v-if="cotizando"
				small
				aria-hidden="true"></b-spinner>
				<span v-else>Calcular</span>
			</b-button>
		</form>

		<!--
			Zipnova no reconoció el código postal solo: primero se intenta resolver la localidad
			con Google Maps (sin molestar), y si eso no está o no resuelve, se le pide al comprador.
		-->
		<div
		v-if="pide_localidad"
		class="envio-cotizador__localidad">
			<p class="envio-cotizador__error">
				{{ error || 'No reconocimos ese código postal. Decinos la localidad y la provincia.' }}
			</p>

			<div class="envio-cotizador__localidad-campos">
				<b-form-select
				v-model="provincia"
				:options="provincias_options"
				aria-label="Provincia"
				class="envio-cotizador__select"></b-form-select>

				<b-form-input
				v-model="localidad"
				autocomplete="address-level2"
				placeholder="Localidad"
				aria-label="Localidad"
				@keyup.enter="cotizar"
				class="envio-cotizador__input"></b-form-input>
			</div>

			<b-button
			:disabled="!puede_cotizar || !provincia || !localidad"
			@click="cotizar"
			class="envio-cotizador__btn envio-cotizador__btn--block">
				<b-spinner
				v-if="cotizando"
				small
				aria-hidden="true"></b-spinner>
				<span v-else>Volver a calcular</span>
			</b-button>
		</div>

		<p
		v-else-if="error && mostrar_error"
		class="envio-cotizador__error">
			{{ error }}
		</p>

		<div
		v-if="opciones_visibles.length"
		class="envio-cotizador__opciones">
			<p
			v-if="texto_destino"
			class="envio-cotizador__destino">
				{{ texto_destino }}
			</p>

			<div
			:role="seleccionable ? 'radiogroup' : null"
			:aria-label="seleccionable ? 'Forma de envío' : null">
				<div
				v-for="opcion in opciones_visibles"
				:key="opcion.key"
				class="envio-opcion"
				:class="{
					'checkout-option': seleccionable,
					'checkout-option--selected': seleccionable && esta_elegida(opcion),
					'envio-opcion--fija': !seleccionable,
				}"
				:role="seleccionable ? 'radio' : null"
				:tabindex="seleccionable ? 0 : null"
				:aria-checked="seleccionable ? (esta_elegida(opcion) ? 'true' : 'false') : null"
				@click="elegir(opcion)"
				@keyup.enter="elegir(opcion)"
				@keyup.space.prevent="elegir(opcion)">

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
						v-if="texto_plazo(opcion)"
						class="envio-opcion__plazo">
							{{ texto_plazo(opcion) }}
						</p>
						<div
						v-if="chips(opcion).length"
						class="checkout-option__tags envio-opcion__chips">
							<span
							v-for="chip in chips(opcion)"
							:key="chip"
							class="checkout-tag checkout-tag--good">
								{{ chip }}
							</span>
						</div>

					</div>

					<p
					class="envio-opcion__precio"
					:class="{'envio-opcion__precio--gratis': es_gratis(opcion)}">
						{{ texto_precio(opcion) }}
					</p>

					<!--
						Retiro en sucursal del correo: el comprador elige en cuál. Va después del precio
						y ocupa todo el ancho de la tarjeta (flex-wrap): adentro del cuerpo, en un
						teléfono, el select quedaba en 150px y no se leía el nombre de la sucursal.
					-->
					<div
					v-if="seleccionable && esta_elegida(opcion) && opcion.es_punto_de_retiro"
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
						v-model="point_id"
						:options="opciones_sucursal(opcion)"
						class="envio-cotizador__select"></b-form-select>
						<p
						v-else
						class="envio-cotizador__hint m-b-0">
							El correo te va a indicar la sucursal más cercana a tu código postal.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
<script>
import { PROVINCIAS, normalizar_provincia } from '@/constants/provincias'
import { firma_de_lineas, lineas_del_carrito } from '@/store/cart'

/**
 * Cotizador de envío por correo (Zipnova): el comprador escribe su código postal y ve los
 * correos que llegan, cuánto sale cada uno y cuántos días tarda.
 *
 * Se usa en tres lugares con el MISMO estado (store `cart.envio`), nunca con `data()` propia:
 *   - página del artículo y modal de agregar al carrito (`articulos` = ese artículo, x1),
 *   - carrito (`usar_carrito`: se monta dos veces, arriba en el teléfono y a la derecha en
 *     escritorio),
 *   - checkout (`usar_carrito` + `seleccionable`: las opciones son tarjetas elegibles y la
 *     elegida es la que viaja al servidor como `opcion_key`).
 *
 * Lo único que vive en el componente son detalles de pantalla (un logo que no cargó, si ya se
 * intentó resolver la localidad con Google Maps).
 *
 * 🔴 El precio que se muestra es el `precio` que devolvió el servidor en cada opción. Acá no se
 * calcula ni se manda ningún precio: al guardar el carrito viaja la `key` de la opción y el
 * servidor la vuelve a cotizar.
 */
export default {
	name: 'CotizadorEnvio',
	props: {
		/**
		 * Líneas a cotizar cuando NO es el carrito: [{id, amount}]. Se llama `articulos` y no
		 * `articles` porque el mixin global generals.js ya define una computed `articles` (los
		 * artículos del catálogo) y Vue no deja que una prop y una computed compartan nombre.
		 */
		articulos: {
			type: Array,
			default: null,
		},
		/** Cotizar el carrito del store (y volver a cotizar solo si cambia). */
		usar_carrito: {
			type: Boolean,
			default: false,
		},
		/** Las opciones se eligen (checkout) en vez de solo informarse (artículo, carrito). */
		seleccionable: {
			type: Boolean,
			default: false,
		},
		/** Título del bloque. */
		titulo: {
			type: String,
			default: 'Calculá el envío',
		},
	},
	data() {
		return {
			/* Ya se intentó resolver la localidad con Google Maps para este código postal. */
			zipcode_resuelto_con_google: null,
			/* Temporizador de la re-cotización automática al cambiar el carrito. */
			timer_recotizar: null,
		}
	},
	computed: {
		/**
		 * Estado del envío en el store.
		 * @returns {object}
		 */
		envio() {
			return this.$store.state.cart.envio
		},
		zipcode: {
			get() {
				return this.envio.zipcode
			},
			set(value) {
				this.$store.commit('cart/set_envio_zipcode', value)
			}
		},
		localidad: {
			get() {
				return this.envio.city
			},
			set(value) {
				this.$store.commit('cart/set_envio_localidad', { city: value })
			}
		},
		provincia: {
			get() {
				return this.envio.state
			},
			set(value) {
				this.$store.commit('cart/set_envio_localidad', { state: value })
			}
		},
		point_id: {
			get() {
				return this.envio.point_id
			},
			set(value) {
				this.$store.commit('cart/set_envio_point_id', value)
			}
		},
		cotizando() {
			return this.envio.cotizando
		},
		error() {
			return this.envio.error
		},
		/**
		 * Líneas que este cotizador cotiza: las del carrito o las que le pasaron por prop.
		 * @returns {Array}
		 */
		lineas() {
			if (this.usar_carrito) {
				return lineas_del_carrito(this.$store.state.cart.cart)
			}
			return this.articulos ? this.articulos : []
		},
		/**
		 * Firma de esas líneas, para saber si las opciones del store son de ESTO o de otra cosa.
		 * @returns {string}
		 */
		firma() {
			return firma_de_lineas(this.lineas)
		},
		/**
		 * Las opciones del store, solo si se cotizaron para estas mismas líneas. Un cotizador de
		 * la página de un artículo no muestra lo que se cotizó para el carrito, y viceversa.
		 * @returns {Array}
		 */
		opciones_visibles() {
			if (!this.envio.opciones.length || this.envio.items_firma !== this.firma) {
				return []
			}
			return this.envio.opciones
		},
		/**
		 * El error solo se muestra si corresponde a lo que este cotizador está cotizando (mismo
		 * criterio que las opciones): un error sin firma (falló la cotización) se muestra siempre.
		 * @returns {boolean}
		 */
		mostrar_error() {
			return this.envio.items_firma === null || this.envio.items_firma === this.firma
		},
		pide_localidad() {
			return this.envio.needs_location && !this.cotizando
		},
		puede_cotizar() {
			return !this.cotizando && String(this.zipcode || '').trim().length >= 4 && this.lineas.length > 0
		},
		provincias_options() {
			let options = [{ value: '', text: 'Provincia' }]
			PROVINCIAS.forEach(provincia => {
				options.push({ value: provincia, text: provincia })
			})
			return options
		},
		/**
		 * "Envíos a Córdoba, Córdoba (CP 5000)" arriba de la lista, con lo que resolvió Zipnova.
		 * @returns {string}
		 */
		texto_destino() {
			if (!this.envio.city && !this.envio.state) {
				return ''
			}
			let partes = []
			if (this.envio.city) {
				partes.push(this.envio.city)
			}
			if (this.envio.state && this.envio.state != this.envio.city) {
				partes.push(this.envio.state)
			}
			return 'Envíos a ' + partes.join(', ') + ' (CP ' + this.envio.zipcode + ')'
		},
		/**
		 * "Envío gratis en compras desde $X", si el comercio lo configuró y todavía no se llega.
		 * @returns {string}
		 */
		hint_envio_gratis() {
			let config = this.commerce ? this.commerce.envios_zipnova_config : null
			if (!config || !config.envio_gratis_desde) {
				return ''
			}
			let desde = Number(config.envio_gratis_desde)
			if (!isFinite(desde) || desde <= 0 || this.envio.envio_gratis) {
				return ''
			}
			return 'Envío gratis en compras desde ' + this.price(desde, false)
		},
	},
	watch: {
		/**
		 * Con el carrito: si cambian las líneas (cantidades, un artículo más) las opciones
		 * quedan viejas y se vuelve a cotizar solo, con un respiro para no disparar una
		 * cotización por cada toque del "+".
		 */
		firma() {
			if (!this.usar_carrito) {
				return
			}
			this.programar_recotizacion()
		},
	},
	created() {
		// Carrito y checkout: si hay código postal y las opciones no son de estas líneas, se
		// cotiza solo. En la página del artículo no: cada artículo que se mira sería una
		// cotización, y el comprador toca "Calcular" cuando le interesa.
		if (this.usar_carrito) {
			this.cotizar_si_hace_falta()
		}
	},
	beforeDestroy() {
		if (this.timer_recotizar) {
			clearTimeout(this.timer_recotizar)
		}
	},
	methods: {
		/**
		 * Cotiza si hay código postal, hay líneas, y las opciones del store no son de estas
		 * líneas. Con una cotización en curso no dispara otra: el carrito monta este componente
		 * dos veces y las dos pasarían por acá en el mismo tick.
		 */
		cotizar_si_hace_falta() {
			if (this.cotizando || !this.puede_cotizar || this.envio.needs_location) {
				return
			}
			if (this.envio.items_firma === this.firma && (this.envio.opciones.length || this.envio.error)) {
				return
			}
			this.cotizar()
		},
		programar_recotizacion() {
			if (this.timer_recotizar) {
				clearTimeout(this.timer_recotizar)
			}
			let self = this
			this.timer_recotizar = setTimeout(function() {
				self.timer_recotizar = null
				self.cotizar_si_hace_falta()
			}, 400)
		},
		/**
		 * Pide la cotización al servidor. Si Zipnova no reconoce el código postal
		 * (`needs_location`), intenta una vez resolver localidad y provincia con Google Maps y
		 * vuelve a cotizar; si no hay Google o no resuelve, queda el formulario de localidad.
		 */
		cotizar() {
			if (!this.puede_cotizar) {
				return
			}
			let self = this
			let payload = { articles: this.lineas }
			if (this.usar_carrito && this.cart && this.cart.id) {
				payload.cart_id = this.cart.id
			}
			this.$store.dispatch('cart/cotizar_envio', payload)
			.then(function() {
				self.$emit('cotizado')
			})
			.catch(function(err) {
				let data = err && err.response && err.response.data ? err.response.data : {}
				if (data.needs_location && !self.envio.city) {
					self.resolver_localidad_con_google()
				}
			})
		},
		/**
		 * Geocodifica el código postal con Google Maps (si está cargado en la página) para sacar
		 * localidad y provincia, y vuelve a cotizar con eso. Una sola vez por código postal: si
		 * tampoco así se resuelve, el comprador lo completa a mano.
		 */
		resolver_localidad_con_google() {
			let zipcode = this.zipcode
			if (this.zipcode_resuelto_con_google === zipcode) {
				return
			}
			this.zipcode_resuelto_con_google = zipcode
			if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
				return
			}
			let self = this
			let geocoder = new window.google.maps.Geocoder()
			try {
				geocoder.geocode({
					componentRestrictions: { country: 'AR', postalCode: zipcode },
				}, function(results, status) {
					if (status !== 'OK' || !results || !results.length || zipcode !== self.zipcode) {
						return
					}
					let localidad = ''
					let provincia = ''
					;(results[0].address_components || []).forEach(function(componente) {
						let tipos = componente.types || []
						if (!localidad && tipos.indexOf('locality') !== -1) {
							localidad = componente.long_name
						}
						if (!provincia && tipos.indexOf('administrative_area_level_1') !== -1) {
							provincia = normalizar_provincia(componente.long_name)
						}
					})
					if (!localidad || !provincia) {
						return
					}
					self.$store.commit('cart/set_envio_localidad', { city: localidad, state: provincia })
					self.cotizar()
				})
			} catch (e) {
				// Google falló: el formulario de localidad ya está a la vista.
			}
		},
		/**
		 * Elige una opción (solo en modo seleccionable).
		 * @param {object} opcion
		 */
		elegir(opcion) {
			if (!this.seleccionable) {
				return
			}
			this.$store.commit('cart/set_envio_opcion_key', opcion.key)
		},
		esta_elegida(opcion) {
			return this.envio.opcion_key == opcion.key
		},
		es_gratis(opcion) {
			return !!(opcion.envio_gratis || Number(opcion.precio) === 0)
		},
		/**
		 * Precio de la opción: "Gratis" o el importe. `price()` del mixin devuelve "-" con cero,
		 * por eso el caso gratis va antes.
		 * @param {object} opcion
		 * @returns {string}
		 */
		texto_precio(opcion) {
			if (this.es_gratis(opcion)) {
				return 'Gratis'
			}
			return this.price(opcion.precio)
		},
		/**
		 * "Llega en 3 a 5 días hábiles", "Llega en 2 días hábiles", "Llega en 1 día hábil" o, sin
		 * días, "Llega el 21/09".
		 * @param {object} opcion
		 * @returns {string}
		 */
		texto_plazo(opcion) {
			let min = opcion.dias_min
			let max = opcion.dias_max
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
			if (opcion.estimated_delivery) {
				let fecha = new Date(opcion.estimated_delivery)
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
		 * @param {object} opcion
		 * @returns {string[]}
		 */
		chips(opcion) {
			let chips = []
			;(opcion.tags || []).forEach(tag => {
				if (tag == 'cheapest') {
					chips.push('Más barato')
				} else if (tag == 'fastest') {
					chips.push('Más rápido')
				}
			})
			return chips
		},
		/**
		 * Opciones del select de sucursales de una opción de retiro.
		 * @param {object} opcion
		 * @returns {Array}
		 */
		opciones_sucursal(opcion) {
			let options = [{ value: null, text: 'Elegí la sucursal' }]
			;(opcion.puntos_de_retiro || []).forEach(punto => {
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
<style lang="sass">
// Cotizador de envío (Zipnova). Colores del tema del comercio, igual que el checkout.
.envio-cotizador
	text-align: left
	margin: 1rem 0

.envio-cotizador__label
	display: flex
	align-items: center
	gap: .5rem
	font-size: .98rem
	font-weight: 700
	color: #1a1a1a
	margin: 0 0 .55rem

	i
		color: var(--secondary-color, #0d6efd)
		font-size: 1.1rem
		line-height: 1

.envio-cotizador__hint
	font-size: .82rem
	color: rgba(0, 0, 0, .55)
	margin: -.3rem 0 .55rem

.envio-cotizador__form
	display: flex
	gap: .5rem
	align-items: stretch

.envio-cotizador__input,
.envio-cotizador__select
	min-height: 44px
	border-radius: 10px
	font-size: 1rem

	&.form-control,
	&.custom-select
		height: auto
		padding: .55rem .8rem
		border-color: rgba(0, 0, 0, .14)

.envio-cotizador__form .envio-cotizador__input
	flex: 1 1 auto
	min-width: 0

.envio-cotizador__btn
	flex: 0 0 auto
	min-height: 44px
	min-width: 6.5rem
	border-radius: 10px !important
	font-weight: 700
	border: none !important
	color: #FFF !important
	background: var(--secondary-color, #0d6efd) !important

	&:disabled
		opacity: .65

.envio-cotizador__btn--block
	width: 100%
	margin-top: .5rem

.envio-cotizador__localidad
	margin-top: .6rem

.envio-cotizador__localidad-campos
	display: flex
	flex-direction: column
	gap: .5rem

	@media screen and (min-width: 768px)
		flex-direction: row

		> *
			flex: 1 1 0
			min-width: 0

.envio-cotizador__error
	font-size: .86rem
	color: #b42318
	margin: .5rem 0 .4rem

.envio-cotizador__opciones
	margin-top: .75rem

.envio-cotizador__destino
	font-size: .82rem
	color: rgba(0, 0, 0, .55)
	margin: 0 0 .5rem

// Una opción (correo + servicio). En el checkout lleva además .checkout-option (tarjeta elegible).
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

// Dentro de la tarjeta del carrito y de la del artículo el bloque va separado del resto.
.cart-summary .envio-cotizador,
.article-data .envio-cotizador
	padding-top: .85rem
	border-top: 1px solid rgba(0, 0, 0, .08)
	margin-bottom: .25rem
</style>
