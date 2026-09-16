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

			<!--
				Checkout: lista elegible completa, sin modal — ahí el comprador tiene que poder
				tocar una opción, un paso extra le suma fricción justo donde no hace falta.
			-->
			<div
			v-if="seleccionable"
			role="radiogroup"
			aria-label="Forma de envío">
				<envio-opcion-card
				v-for="opcion in opciones_visibles"
				:key="opcion.key"
				:opcion="opcion"
				seleccionable
				:elegida="esta_elegida(opcion)"
				:point_id="point_id"
				@click="elegir(opcion)"
				@input="point_id = $event"></envio-opcion-card>
			</div>

			<!--
				Artículo y carrito: solo informan. Se muestra el más barato y el resto queda en un
				modal aparte — la lista completa apretada adentro de la tarjeta del artículo era
				el problema que reportó Lucas.
			-->
			<template v-else>
				<envio-opcion-card :opcion="opcion_mas_barata"></envio-opcion-card>

				<button
				type="button"
				v-b-modal="'envio-modal-' + _uid"
				class="envio-cotizador__link-modal">
					Costos y tiempo de entrega
				</button>

				<b-modal
				:id="'envio-modal-' + _uid"
				title="Costos y tiempo de entrega"
				hide-footer
				centered>
					<envio-opcion-card
					v-for="opcion in opciones_visibles"
					:key="opcion.key"
					:opcion="opcion"></envio-opcion-card>
				</b-modal>
			</template>
		</div>
	</div>
</template>
<script>
import { PROVINCIAS, normalizar_provincia } from '@/constants/provincias'
import { firma_de_lineas, lineas_del_carrito } from '@/store/cart'
import EnvioOpcionCard from '@/components/common/envio/EnvioOpcionCard'

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
	components: {
		EnvioOpcionCard,
	},
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
		/**
		 * La opción más barata de `opciones_visibles`, para el resumen que se ve sin abrir el
		 * modal (artículo y carrito). Zipnova ya las devuelve ordenadas por precio
		 * (`ZipnovaCotizadorService::cotizar` manda `sort_by: 'price'`), pero acá se busca el
		 * mínimo explícito en vez de asumir `[0]`: es una sola cuenta y no depende de que ese
		 * orden se mantenga si el día de mañana cambia el criterio de ordenamiento.
		 * @returns {object}
		 */
		opcion_mas_barata() {
			return this.opciones_visibles.reduce(function(mas_barata, opcion) {
				if (!mas_barata || Number(opcion.precio) < Number(mas_barata.precio)) {
					return opcion
				}
				return mas_barata
			}, null)
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
		// cotiza solo. En la página del artículo NO, salvo la excepción de abajo: cada artículo
		// que se mira sería una cotización, y el comprador toca "Calcular" cuando le interesa.
		if (this.usar_carrito) {
			this.cotizar_si_hace_falta()
			return
		}
		/*
		 * Excepción acotada: si el buyer está logueado y ya tiene un código postal guardado de
		 * una cotización anterior (`envio_zipcode`), se lo precarga y se cotiza UNA vez al entrar
		 * a la ficha — es lo que Lucas pidió ("que ya le aparezca el costo del envío más barato").
		 * No dispara nada para un visitante anónimo ni para un buyer sin código postal guardado:
		 * esos dos casos siguen tocando "Calcular" como siempre, por el motivo de arriba.
		 */
		let buyer = this.$store.state.auth.user
		if (buyer && buyer.envio_zipcode && !this.zipcode) {
			this.$store.commit('cart/set_envio_zipcode', buyer.envio_zipcode)
			this.$store.commit('cart/set_envio_localidad', { city: buyer.envio_city, state: buyer.envio_state })
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
				self.guardar_zipcode_en_el_perfil()
			})
			.catch(function(err) {
				let data = err && err.response && err.response.data ? err.response.data : {}
				if (data.needs_location && !self.envio.city) {
					self.resolver_localidad_con_google()
				}
			})
		},
		/**
		 * Si hay un buyer logueado y lo que se acaba de cotizar (con localidad/provincia YA
		 * resueltas, no `needs_location`) difiere de lo que tiene guardado, lo guarda en su
		 * perfil para la próxima visita. Va acá y no en un solo lugar del carrito/checkout para
		 * cubrir los tres cotizadores (artículo, carrito, checkout) desde donde ya se resuelve la
		 * cotización con éxito. No bloquea ni avisa si falla: es un guardado de conveniencia.
		 */
		guardar_zipcode_en_el_perfil() {
			let buyer = this.$store.state.auth.user
			if (!buyer || this.envio.needs_location || !this.envio.zipcode) {
				return
			}
			if (
				buyer.envio_zipcode === this.envio.zipcode
				&& (buyer.envio_city || '') === (this.envio.city || '')
				&& (buyer.envio_state || '') === (this.envio.state || '')
			) {
				return
			}
			this.$store.dispatch('auth/guardar_envio_zipcode', {
				zipcode: this.envio.zipcode,
				city: this.envio.city || null,
				state: this.envio.state || null,
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
				// eslint-disable-next-line no-console
				console.warn('Cotizador: Google Maps no está cargado, no se puede resolver el código postal solo.')
				return
			}
			let self = this
			let geocoder = new window.google.maps.Geocoder()
			try {
				geocoder.geocode({
					componentRestrictions: { country: 'AR', postalCode: zipcode },
				}, function(results, status) {
					if (status !== 'OK' || !results || !results.length) {
						/*
						 * Silencioso para el comprador (el formulario de localidad ya está a la vista
						 * desde que llegó needs_location), pero NO para la consola: acá se detectó, el
						 * 16/9/2026, que un REQUEST_DENIED por falta de facturación en el proyecto de
						 * Google Cloud hacía fallar el geocoder para CUALQUIER código postal, no solo
						 * para uno inválido, y antes de este log no había forma de distinguir un caso
						 * del otro sin ir a pegarle a la API a mano.
						 */
						// eslint-disable-next-line no-console
						console.warn('Cotizador: Google Maps no pudo resolver el código postal ' + zipcode + ' (status: ' + status + ').')
						return
					}
					if (zipcode !== self.zipcode) {
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

// Resumen no seleccionable (artículo, carrito): texto-link que abre el modal con el resto de
// las opciones. Sin fondo ni borde a propósito — no compite con "Calcular" ni con "Agregar".
.envio-cotizador__link-modal
	display: inline-block
	margin-top: .5rem
	padding: 0
	border: none
	background: none
	font-size: .88rem
	font-weight: 600
	color: var(--secondary-color, #0d6efd)
	text-decoration: underline
	text-underline-offset: 2px
	cursor: pointer

	&:hover,
	&:focus
		opacity: .8

// Dentro de la tarjeta del carrito y de la del artículo el bloque va separado del resto.
.cart-summary .envio-cotizador,
.article-data .envio-cotizador
	padding-top: .85rem
	border-top: 1px solid rgba(0, 0, 0, .08)
	margin-bottom: .25rem
</style>
