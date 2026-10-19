<template>
	<div class="buscador-direccion">

		<!-- 1) Buscar: el comprador tipea y elige de la lista de Google. -->
		<div
		v-if="fase === 'buscar'"
		class="buscador-direccion__buscar">
			<label
			:for="id_base + '-input'"
			class="checkout-field__label">
				Buscá tu dirección (calle y altura)
			</label>
			<div class="buscador-direccion__input-wrap">
				<i
				class="bi bi-search buscador-direccion__lupa"
				aria-hidden="true"></i>
				<input
				:id="id_base + '-input'"
				ref="input"
				v-model="texto"
				type="text"
				class="form-control buscador-direccion__input"
				autocomplete="off"
				autocorrect="off"
				spellcheck="false"
				enterkeyhint="search"
				maxlength="200"
				placeholder="Ej: Av. Corrientes 1234"
				role="combobox"
				aria-autocomplete="list"
				:aria-expanded="sugerencias.length ? 'true' : 'false'"
				:aria-controls="id_base + '-lista'"
				:aria-activedescendant="activa >= 0 && sugerencias.length ? id_base + '-lista-' + activa : null"
				@input="al_escribir"
				@keydown.down.prevent="mover(1)"
				@keydown.up.prevent="mover(-1)"
				@keydown.enter.prevent="elegir_activa"
				@keydown.esc="cerrar_sugerencias">
				<b-spinner
				v-if="buscando || cargando_detalle"
				small
				class="buscador-direccion__spinner"
				aria-hidden="true"></b-spinner>
			</div>

			<sugerencias-direccion
			:id_lista="id_base + '-lista'"
			:sugerencias="sugerencias"
			:activa="activa"
			@activar="activa = $event"
			@elegir="elegir"></sugerencias-direccion>

			<p
			v-if="cargando_detalle"
			class="buscador-direccion__aviso">
				Cargando la dirección...
			</p>
			<p
			v-else-if="sin_resultados"
			class="buscador-direccion__aviso">
				No encontramos esa dirección. Probá escribiéndola de otra forma o cargala a mano.
			</p>

			<button
			type="button"
			class="buscador-direccion__link"
			@click="pasar_a_mano('')">
				<i class="bi bi-pencil-square"></i>
				No encuentro mi dirección
			</button>
		</div>

		<!-- 2) Completar: eligió una dirección de Google y faltan los datos que Google no sabe. -->
		<div
		v-else-if="fase === 'completar'"
		class="buscador-direccion__completar">
			<div class="buscador-direccion__elegida">
				<i
				class="bi bi-geo-alt-fill buscador-direccion__elegida-pin"
				aria-hidden="true"></i>
				<div class="buscador-direccion__elegida-textos">
					<p class="buscador-direccion__elegida-calle">
						{{ renglon_calle }}
					</p>
					<p class="buscador-direccion__elegida-localidad">
						{{ renglon_localidad }}
					</p>
				</div>
				<button
				type="button"
				class="buscador-direccion__link buscador-direccion__link--chico"
				@click="volver_a_buscar">
					Cambiar
				</button>
			</div>

			<campos-direccion
			v-model="borrador"
			:id_base="id_base + '-campos'"
			:campos="campos_a_completar"
			:requeridos="requeridos"
			:errores="errores_visibles"></campos-direccion>
		</div>

		<!-- 3) A mano: sin Google, Google falló, o el comprador no encontró su dirección. -->
		<div
		v-else
		class="buscador-direccion__manual">
			<p
			v-if="motivo_manual"
			class="buscador-direccion__aviso buscador-direccion__aviso--manual">
				{{ motivo_manual }}
			</p>

			<campos-direccion
			v-model="borrador"
			:id_base="id_base + '-campos'"
			:campos="campos_a_mano"
			:requeridos="requeridos"
			:errores="errores_visibles"></campos-direccion>

			<button
			type="button"
			class="buscador-direccion__link"
			@click="volver_a_buscar">
				<i class="bi bi-search"></i>
				Buscar mi dirección
			</button>
		</div>

		<p
		v-if="texto_faltantes"
		class="buscador-direccion__error"
		role="alert">
			{{ texto_faltantes }}
		</p>

		<div class="buscador-direccion__acciones">
			<b-button
			v-if="fase !== 'buscar'"
			block
			:disabled="guardando"
			class="buscador-direccion__confirmar"
			@click="confirmar">
				<b-spinner
				v-if="guardando"
				small
				class="m-r-10"></b-spinner>
				{{ texto_confirmar }}
			</b-button>
			<button
			v-if="cancelable"
			type="button"
			:disabled="guardando"
			class="buscador-direccion__link buscador-direccion__cancelar"
			@click="$emit('cancelar')">
				Cancelar
			</button>
		</div>
	</div>
</template>
<script>
import SugerenciasDireccion from '@/components/common/direcciones/SugerenciasDireccion'
import CamposDireccion from '@/components/common/direcciones/CamposDireccion'
import {
	direccion_vacia,
	normalizar_direccion,
	armar_formatted_address,
	faltantes_de_direccion,
	etiqueta_de_campo,
	separar_calle_y_altura,
	renglon_de_la_calle,
	renglon_de_la_localidad,
} from '@/helpers/direcciones'
import {
	resolver_places,
	nuevo_token,
	buscar_sugerencias,
	detalle_de_sugerencia,
	avisar_una_vez,
	google_ya_fallo,
	marcar_google_ok,
} from '@/helpers/google_places'

/** Cuánto se espera después de la última tecla para pedirle sugerencias a Google. */
const DEBOUNCE_MS = 300

/** Desde cuántos caracteres se busca. */
const MINIMO_DE_CARACTERES = 3

/**
 * Buscador de direcciones con autocompletado de Google Places (New) (misión
 * formas-envio-direcciones-maps, 19/10/2026). Reemplaza los campos de texto libre de la dirección
 * de entrega: el comprador tipea, ve una lista con la calle, la localidad y la provincia, elige, y
 * completa solo lo que Google no sabe (piso/depto, referencia, y la altura o el código postal si
 * no vinieron).
 *
 * Tres fases:
 *   1. `buscar`: input con debounce de 300 ms desde 3 caracteres, un token de sesión por búsqueda
 *      (Google cobra por sesión), lista navegable con flechas + Enter y con el dedo.
 *   2. `completar`: la dirección elegida en una tarjeta, con los campos que faltan.
 *   3. `manual`: todos los campos a mano (calle, altura, piso/depto, localidad, provincia,
 *      código postal, referencia).
 *
 * 🔴 LA DEGRADACIÓN A `manual` ES OBLIGATORIA Y ES EL CAMINO DE HOY: al 19/10/2026 el proyecto de
 * Google no tiene facturación y Places responde PERMISSION_DENIED. Se pasa a mano si no hay
 * `window.google.maps`, si la búsqueda o el detalle fallan o tardan más de 8 s, o si el comprador
 * toca "No encuentro mi dirección". La compra nunca queda trabada por Google. El error se deja en
 * la consola una sola vez (`avisar_una_vez`), y si Google ya falló en esta carga de página el
 * buscador arranca directo a mano.
 *
 * No guarda nada: al tocar el botón emite `confirmar` con la dirección normalizada (forma del
 * contrato, ver helpers/direcciones.js) y el padre decide (guardarla en la cuenta, o usarla para
 * este pedido). `cancelar` si el comprador se arrepiente (solo con `cancelable`).
 *
 * Para probarlo sin facturación, se inyecta un `window.google.maps.places` falso desde el
 * navegador: nada de esto guarda referencias a `google` al importarse (ver helpers/google_places.js).
 */
export default {
	name: 'BuscadorDireccion',
	components: {
		SugerenciasDireccion,
		CamposDireccion,
	},
	props: {
		/** Texto del botón que confirma la dirección. */
		texto_confirmar: {
			type: String,
			default: 'Usar esta dirección',
		},
		/**
		 * El código postal es obligatorio: la tienda cotiza el envío por correo con Zipnova, que
		 * cotiza por código postal. Si Google no lo trajo, se le pide al comprador.
		 */
		pide_codigo_postal: {
			type: Boolean,
			default: false,
		},
		/** Muestra "Cancelar" (agregar otra a una lista que ya tiene, o cambiar la elegida). */
		cancelable: {
			type: Boolean,
			default: false,
		},
		/** El padre está guardando lo confirmado: el botón muestra el spinner y no se repite. */
		guardando: {
			type: Boolean,
			default: false,
		},
	},
	data() {
		return {
			fase: google_ya_fallo() ? 'manual' : 'buscar',
			texto: '',
			sugerencias: [],
			activa: -1,
			buscando: false,
			cargando_detalle: false,
			sin_resultados: false,
			/* La dirección que se está armando (forma del contrato). */
			borrador: direccion_vacia(),
			/* Qué trajo Google de la dirección elegida: la altura y el código postal se piden solo si no. */
			trajo_altura: false,
			trajo_codigo_postal: false,
			/* `formattedAddress` de Google, solo si trajo la altura (si no, no la tiene y se rearma). */
			formatted_de_google: '',
			/* Ya tocó el botón una vez: desde ahí se marcan en rojo los campos que faltan. */
			intento_confirmar: false,
			motivo_manual: google_ya_fallo() ? 'Cargá tu dirección:' : '',
			/* Temporizador del debounce y número de pedido (descarta respuestas viejas). */
			timer: null,
			pedido: 0,
			/* Token de sesión de Google para la búsqueda en curso. */
			token: null,
		}
	},
	computed: {
		/**
		 * Prefijo único de los ids de la página: el checkout y "Mis direcciones" pueden tener un
		 * buscador cada uno, y los labels apuntan por id.
		 *
		 * @returns {string}
		 */
		id_base() {
			return 'direccion-' + this._uid
		},
		requeridos() {
			let requeridos = ['street', 'street_number', 'city', 'province']
			if (this.pide_codigo_postal) {
				requeridos.push('zip_code')
			}
			return requeridos
		},
		/**
		 * En la fase `completar`: la altura solo si Google no la trajo; el código postal solo si
		 * no lo trajo y hace falta; piso/depto y referencia siempre.
		 *
		 * @returns {string[]}
		 */
		campos_a_completar() {
			let campos = []
			if (!this.trajo_altura) {
				campos.push('street_number')
			}
			campos.push('apartment')
			if (!this.trajo_codigo_postal && this.pide_codigo_postal) {
				campos.push('zip_code')
			}
			campos.push('reference')
			return campos
		},
		campos_a_mano() {
			return ['street', 'street_number', 'apartment', 'zip_code', 'city', 'province', 'reference']
		},
		faltantes() {
			return faltantes_de_direccion(this.borrador, this.pide_codigo_postal)
		},
		errores_visibles() {
			return this.intento_confirmar ? this.faltantes : []
		},
		/**
		 * "Completá: Altura, Código postal", debajo de los campos y arriba del botón, después del
		 * primer intento. Con la dirección completa desaparece solo.
		 *
		 * @returns {string}
		 */
		texto_faltantes() {
			if (!this.intento_confirmar || this.fase === 'buscar' || !this.faltantes.length) {
				return ''
			}
			let etiquetas = this.faltantes.map(clave => etiqueta_de_campo(clave))
			return 'Completá: ' + etiquetas.join(', ') + '.'
		},
		renglon_calle() {
			return renglon_de_la_calle(Object.assign({}, this.borrador, { apartment: '' })) || 'Dirección elegida'
		},
		renglon_localidad() {
			return renglon_de_la_localidad(this.borrador)
		},
	},
	beforeDestroy() {
		if (this.timer) {
			clearTimeout(this.timer)
		}
		// Cualquier respuesta que llegue después ya no es de nadie.
		this.pedido++
	},
	methods: {
		/**
		 * Cada tecla: reprograma la búsqueda (debounce) o, con menos de 3 caracteres, limpia la
		 * lista.
		 */
		al_escribir() {
			this.sin_resultados = false
			if (this.timer) {
				clearTimeout(this.timer)
				this.timer = null
			}
			if (this.texto.trim().length < MINIMO_DE_CARACTERES) {
				// Un pedido en vuelo ya no corresponde a lo que está escrito.
				this.pedido++
				this.buscando = false
				this.sugerencias = []
				this.activa = -1
				return
			}
			let self = this
			this.timer = setTimeout(function() {
				self.timer = null
				self.buscar()
			}, DEBOUNCE_MS)
		},
		/**
		 * Le pide sugerencias a Google para lo escrito. Una respuesta que llega cuando ya se
		 * escribió otra cosa se descarta (`pedido`). Sin Google o con error: a mano.
		 */
		buscar() {
			let texto = this.texto.trim()
			if (texto.length < MINIMO_DE_CARACTERES) {
				return
			}
			let self = this
			let pedido = ++this.pedido
			this.buscando = true
			resolver_places()
			.then(function(libreria) {
				if (pedido !== self.pedido) {
					return null
				}
				if (!libreria) {
					self.buscando = false
					avisar_una_vez('google.maps.places no está cargado')
					self.pasar_a_mano('sin_google')
					return null
				}
				if (!self.token) {
					self.token = nuevo_token(libreria)
				}
				return buscar_sugerencias(libreria, texto, self.token)
				.then(function(sugerencias) {
					if (pedido !== self.pedido) {
						return
					}
					marcar_google_ok()
					self.buscando = false
					self.sugerencias = sugerencias
					self.activa = sugerencias.length ? 0 : -1
					self.sin_resultados = !sugerencias.length
				})
			})
			.catch(function(err) {
				if (pedido !== self.pedido) {
					return
				}
				self.buscando = false
				avisar_una_vez('la búsqueda falló', err)
				self.pasar_a_mano('error')
			})
		},
		/**
		 * Flechas del teclado sobre la lista (da la vuelta en los extremos).
		 *
		 * @param {number} paso 1 o -1
		 */
		mover(paso) {
			let cantidad = this.sugerencias.length
			if (!cantidad) {
				return
			}
			this.activa = (this.activa + paso + cantidad) % cantidad
		},
		elegir_activa() {
			if (this.activa >= 0 && this.sugerencias[this.activa]) {
				this.elegir(this.sugerencias[this.activa])
			}
		},
		cerrar_sugerencias() {
			this.sugerencias = []
			this.activa = -1
		},
		/**
		 * Eligió una sugerencia: se trae el detalle del lugar (componentes, coordenadas) y se pasa
		 * a completar lo que falte. Si el detalle falla, a mano con lo que se sabe de la sugerencia.
		 *
		 * @param {object} sugerencia
		 */
		elegir(sugerencia) {
			if (this.cargando_detalle) {
				return
			}
			let self = this
			// Corta cualquier búsqueda en vuelo: su lista ya no importa.
			let pedido = ++this.pedido
			if (this.timer) {
				clearTimeout(this.timer)
				this.timer = null
			}
			this.buscando = false
			this.cargando_detalle = true
			detalle_de_sugerencia(sugerencia)
			.then(function(direccion) {
				if (pedido !== self.pedido) {
					return
				}
				self.cargando_detalle = false
				// La sesión de Google termina con el detalle: la próxima búsqueda es otra sesión.
				self.token = null
				self.cerrar_sugerencias()
				self.aplicar_de_google(direccion)
			})
			.catch(function(err) {
				if (pedido !== self.pedido) {
					return
				}
				self.cargando_detalle = false
				self.token = null
				avisar_una_vez('no se pudo traer el detalle de la dirección', err)
				self.texto = sugerencia.principal || self.texto
				self.pasar_a_mano('error')
			})
		},
		/**
		 * Pone en el borrador lo que trajo Google y elige la fase: `completar` si están la calle,
		 * la localidad y la provincia; si falta alguna (eligió un barrio, un comercio sin calle),
		 * `manual` con lo que sí vino ya cargado.
		 *
		 * @param {object} direccion Ver `direccion_desde_lugar` (helpers/google_places.js).
		 */
		aplicar_de_google(direccion) {
			let borrador = direccion_vacia()
			borrador.street = direccion.street
			borrador.street_number = direccion.street_number
			borrador.city = direccion.city
			borrador.province = direccion.province
			borrador.zip_code = direccion.zip_code
			this.trajo_altura = direccion.street_number !== ''
			this.trajo_codigo_postal = direccion.zip_code !== ''
			this.formatted_de_google = direccion.numero_de_google ? direccion.formatted_address : ''
			this.intento_confirmar = false

			if (direccion.street && direccion.city && direccion.province) {
				borrador.lat = direccion.lat
				borrador.lng = direccion.lng
				borrador.place_id = direccion.place_id
				this.borrador = borrador
				this.fase = 'completar'
				this.enfocar_primer_campo()
				return
			}

			/*
			 * Sin calle, las coordenadas son las de un barrio o una localidad entera, no las del
			 * domicilio: no se guardan, si no el vendedor vería el pin en el lugar equivocado.
			 */
			this.borrador = borrador
			this.fase = 'manual'
			this.motivo_manual = 'Completá los datos que faltan de tu dirección:'
			this.enfocar_primer_campo()
		},
		/**
		 * Pasa a la carga a mano. Lo escrito en el buscador ("Corrientes 1234") se aprovecha como
		 * calle y altura, si todavía no hay nada cargado.
		 *
		 * @param {string} motivo '' (lo pidió el comprador), 'sin_google' o 'error'.
		 */
		pasar_a_mano(motivo) {
			if (this.timer) {
				clearTimeout(this.timer)
				this.timer = null
			}
			this.pedido++
			this.buscando = false
			this.cerrar_sugerencias()
			this.token = null
			this.formatted_de_google = ''
			if (!this.borrador.street && !this.borrador.street_number && this.texto.trim()) {
				let partes = separar_calle_y_altura(this.texto)
				this.borrador = Object.assign({}, this.borrador, partes)
			}
			// Lo cargado a mano no tiene coordenadas de Google.
			this.borrador = Object.assign({}, this.borrador, { lat: null, lng: null, place_id: null })
			this.motivo_manual = motivo ? 'No pudimos buscar tu dirección automáticamente. Cargala acá:' : ''
			this.fase = 'manual'
			this.enfocar_primer_campo()
		},
		/**
		 * Vuelve al buscador (desde la tarjeta o desde la carga a mano) con lo escrito antes.
		 */
		volver_a_buscar() {
			this.borrador = direccion_vacia()
			this.trajo_altura = false
			this.trajo_codigo_postal = false
			this.formatted_de_google = ''
			this.intento_confirmar = false
			this.motivo_manual = ''
			this.fase = 'buscar'
			let self = this
			this.$nextTick(function() {
				if (self.$refs.input) {
					self.$refs.input.focus()
				}
				if (self.texto.trim().length >= MINIMO_DE_CARACTERES) {
					self.buscar()
				}
			})
		},
		/**
		 * Lleva el foco al primer campo visible para completar (en el teléfono abre el teclado
		 * justo donde tiene que escribir).
		 */
		enfocar_primer_campo() {
			let self = this
			this.$nextTick(function() {
				let campo = self.$el ? self.$el.querySelector('.campos-direccion input, .campos-direccion select') : null
				if (campo) {
					campo.focus()
				}
			})
		},
		/**
		 * Valida y emite la dirección. Si falta algo, se marca en rojo y se dice qué.
		 *
		 * La línea (`formatted_address`) es la de Google si trajo la altura; si no (o si se cargó
		 * a mano), se arma con las partes: la de Google sin altura diría "Av. Corrientes, CABA".
		 */
		confirmar() {
			if (this.guardando) {
				return
			}
			this.intento_confirmar = true
			if (this.faltantes.length) {
				this.enfocar_primer_faltante()
				return
			}
			let direccion = normalizar_direccion(this.borrador)
			if (this.fase === 'completar' && this.formatted_de_google) {
				direccion.formatted_address = this.formatted_de_google
			} else {
				direccion.formatted_address = armar_formatted_address(direccion)
			}
			this.$emit('confirmar', direccion)
		},
		enfocar_primer_faltante() {
			let id = this.id_base + '-campos-' + this.faltantes[0]
			this.$nextTick(function() {
				let campo = document.getElementById(id)
				if (campo) {
					campo.focus()
				}
			})
		},
	},
}
</script>
<style lang="sass">
// Buscador de direcciones (Google Places + carga a mano). Una columna, inputs de 44px.
.buscador-direccion
	text-align: left

.buscador-direccion__input-wrap
	position: relative

.buscador-direccion__lupa
	position: absolute
	left: .85rem
	top: 50%
	transform: translateY(-50%)
	color: rgba(0, 0, 0, .45)
	pointer-events: none

// Especificidad de más a propósito: tiene que ganarle al padding de `.checkout-section .form-control`
// (sass/_checkout.sass) sin depender del orden en que se cargan las hojas.
.buscador-direccion__input-wrap .form-control.buscador-direccion__input
	min-height: 44px
	padding-left: 2.4rem
	padding-right: 2.4rem
	font-size: 1rem

.buscador-direccion__spinner
	position: absolute
	right: .85rem
	top: 50%
	margin-top: -.5rem
	color: var(--secondary-color, #0d6efd)

.buscador-direccion__aviso
	font-size: .85rem
	color: rgba(0, 0, 0, .6)
	margin: .5rem 0 0

.buscador-direccion__aviso--manual
	margin: 0 0 .75rem

.buscador-direccion__error
	font-size: .85rem
	font-weight: 600
	color: #c0392b
	margin: .25rem 0 .5rem

.buscador-direccion__link
	display: inline-flex
	align-items: center
	gap: .35rem
	min-height: 44px
	padding: .5rem 0
	background: none
	border: none
	font-size: .9rem
	font-weight: 600
	color: var(--secondary-color, #0d6efd)
	text-decoration: underline
	cursor: pointer

	&:disabled
		opacity: .5

.buscador-direccion__link--chico
	flex: 0 0 auto
	min-height: 0
	padding: .25rem 0 .25rem .5rem

.buscador-direccion__elegida
	display: flex
	align-items: flex-start
	gap: .7rem
	padding: .8rem .9rem
	margin-bottom: .9rem
	border-radius: 12px
	background: color-mix(in srgb, var(--secondary-color, #0d6efd) 6%, #fff)
	border: 1px solid color-mix(in srgb, var(--secondary-color, #0d6efd) 35%, transparent)

.buscador-direccion__elegida-pin
	flex: 0 0 auto
	font-size: 1.3rem
	line-height: 1
	margin-top: 2px
	color: var(--secondary-color, #0d6efd)

.buscador-direccion__elegida-textos
	flex: 1 1 auto
	min-width: 0

.buscador-direccion__elegida-calle
	font-size: .98rem
	font-weight: 600
	color: #1a1a1a
	margin: 0
	overflow-wrap: anywhere

.buscador-direccion__elegida-localidad
	font-size: .85rem
	color: rgba(0, 0, 0, .6)
	margin: .15rem 0 0
	overflow-wrap: anywhere

.buscador-direccion__acciones
	margin-top: .5rem

.buscador-direccion__confirmar
	min-height: 44px
	border-radius: 10px !important
	font-weight: 700 !important
	border: none !important
	color: #FFF !important
	background: var(--secondary-color, #0d6efd) !important

.buscador-direccion__cancelar
	display: flex
	justify-content: center
	width: 100%
</style>
