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
				@blur="al_salir_del_input"
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
			@click="pasar_a_mano('', true)">
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

		<!-- Se aplica sola (una dirección para el pedido): qué falta, o a dónde va. -->
		<template v-if="aplicar_solo && fase !== 'buscar'">
			<p
			v-if="completa"
			class="buscador-direccion__lista">
				<i class="bi bi-check-circle-fill"></i>
				<span>Te lo enviamos a {{ linea_completa }}</span>
			</p>
			<p
			v-else
			class="buscador-direccion__aviso buscador-direccion__aviso--falta">
				Para usar esta dirección, completá: {{ etiquetas_faltantes.join(', ') }}.
			</p>
		</template>

		<p
		v-else-if="texto_faltantes"
		class="buscador-direccion__error"
		role="alert">
			{{ texto_faltantes }}
		</p>

		<div class="buscador-direccion__acciones">
			<b-button
			v-if="fase !== 'buscar' && !aplicar_solo"
			block
			:disabled="ocupado"
			class="buscador-direccion__confirmar"
			@click="confirmar">
				<b-spinner
				v-if="ocupado"
				small
				class="m-r-10"></b-spinner>
				{{ texto_confirmar }}
			</b-button>
			<button
			v-if="cancelable"
			type="button"
			:disabled="ocupado"
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
	partir_altura_de_la_calle,
	codigo_postal_limpio,
	linea_de_direccion,
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
	geocodificar,
} from '@/helpers/google_places'

/** Cuánto se espera después de la última tecla para pedirle sugerencias a Google. */
const DEBOUNCE_MS = 300

/** Desde cuántos caracteres se busca. */
const MINIMO_DE_CARACTERES = 3

/**
 * Si Google falla mientras el comprador escribe, cuánto tiene que pasar sin teclas para recién ahí
 * pasar a la carga a mano (ver `diferir_paso_a_mano`).
 */
const PAUSA_PARA_PASAR_A_MANO_MS = 1500

/** Con `aplicar_solo`: cuánto se espera después del último cambio para aplicar la dirección. */
const DEBOUNCE_APLICAR_MS = 600

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
 * 🔴 Y SI FALLA MIENTRAS ESCRIBE, NO SE LE CAMBIA LA PANTALLA EN LA CARA: se espera a que deje de
 * tipear (1,5 s sin teclas) o a que salga del campo, y recién ahí pasa a mano con lo escrito
 * repartido en calle y altura y el cursor al final del campo que corresponde. Hoy, sin
 * facturación, es el camino de todos los compradores.
 *
 * Dos formas de entregar la dirección:
 *   - Por defecto, el botón (`texto_confirmar`) emite `confirmar` con la dirección normalizada
 *     (forma del contrato, ver helpers/direcciones.js) y el padre decide (guardarla en la cuenta).
 *     Mientras haya una completa sin confirmar emite `pendiente: true` (el checkout avisa si el
 *     comprador quiere terminar la compra sin confirmarla).
 *   - Con `aplicar_solo` (una sola dirección para el pedido: invitado, vendedor) no hay botón:
 *     apenas la dirección está completa se emite `aplicar` con ella, y otra vez con cada cambio
 *     (piso, referencia...), o con null si deja de estar completa.
 *
 * Una dirección cargada a mano se intenta geocodificar en silencio (Geocoder de Maps, 5 s) para
 * que el vendedor tenga el pin en el ERP; sin facturación falla y no se nota.
 *
 * `cancelar` si el comprador se arrepiente (solo con `cancelable`).
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
		/**
		 * Sin botón: la dirección se aplica sola apenas está completa (evento `aplicar`). Es el modo
		 * de una sola dirección para el pedido, donde no hay nada que guardar.
		 */
		aplicar_solo: {
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
			/*
			 * Google falló mientras escribía: el motivo, cuándo fue la última tecla y el temporizador
			 * que pasa a mano cuando deja de tipear. Ver `diferir_paso_a_mano`.
			 */
			fallo_pendiente: '',
			ultima_tecla: 0,
			timer_mano: null,
			/* Con `aplicar_solo`: temporizador y firma de la última dirección aplicada. */
			timer_aplicar: null,
			ultima_aplicada: '',
			/* Número de la última aplicación, para descartar coordenadas que llegan tarde. */
			serie_aplicada: 0,
			/* Geocodificando una dirección a mano antes de confirmarla (hasta 5 s). */
			geocodificando: false,
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
		ocupado() {
			return this.guardando || this.geocodificando
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
		/**
		 * El borrador como se va a usar: en la carga a mano, si la altura está vacía y la calle
		 * termina en un número ("San Martín 450"), se separan solos en vez de dar error.
		 *
		 * @returns {object}
		 */
		borrador_efectivo() {
			return this.fase === 'manual' ? partir_altura_de_la_calle(this.borrador) : this.borrador
		},
		faltantes() {
			return faltantes_de_direccion(this.borrador_efectivo, this.pide_codigo_postal)
		},
		/** La dirección está lista para usarse (fuera del buscador y sin nada que falte). */
		completa() {
			return this.fase !== 'buscar' && !this.faltantes.length
		},
		errores_visibles() {
			return this.intento_confirmar ? this.faltantes : []
		},
		/**
		 * Los nombres de lo que falta. El código postal escrito pero que no sirve (menos de 4
		 * letras o números) dice cómo tiene que ser.
		 *
		 * @returns {string[]}
		 */
		etiquetas_faltantes() {
			let escrito = codigo_postal_limpio(this.borrador.zip_code) !== ''
			return this.faltantes.map(clave => {
				if (clave === 'zip_code' && escrito) {
					return 'Código postal (de 4 a 8 letras o números)'
				}
				return etiqueta_de_campo(clave)
			})
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
			return 'Completá: ' + this.etiquetas_faltantes.join(', ') + '.'
		},
		/** La línea de la dirección completa, para el "Te lo enviamos a..." de `aplicar_solo`. */
		linea_completa() {
			return this.completa ? linea_de_direccion(this.construir()) : ''
		},
		renglon_calle() {
			return renglon_de_la_calle(Object.assign({}, this.borrador, { apartment: '' })) || 'Dirección elegida'
		},
		renglon_localidad() {
			return renglon_de_la_localidad(this.borrador)
		},
	},
	watch: {
		/* Sin `aplicar_solo`: el checkout tiene que saber si hay una completa sin confirmar. */
		completa(valor) {
			if (!this.aplicar_solo) {
				this.$emit('pendiente', valor)
			}
		},
		borrador() {
			if (this.aplicar_solo) {
				this.programar_aplicar()
			}
		},
		fase() {
			if (this.aplicar_solo) {
				this.programar_aplicar()
			}
		},
	},
	beforeDestroy() {
		let timers = [this.timer, this.timer_mano, this.timer_aplicar]
		timers.forEach(timer => {
			if (timer) {
				clearTimeout(timer)
			}
		})
		// Cualquier respuesta que llegue después ya no es de nadie.
		this.pedido++
		this.serie_aplicada++
		if (!this.aplicar_solo) {
			this.$emit('pendiente', false)
		}
	},
	methods: {
		/**
		 * Cada tecla: reprograma la búsqueda (debounce) o, con menos de 3 caracteres, limpia la
		 * lista. Si Google ya falló, no se busca más: solo se corre la espera para pasar a mano.
		 */
		al_escribir() {
			this.ultima_tecla = Date.now()
			this.sin_resultados = false
			// Escribió de nuevo: el detalle que se estaba trayendo ya no corresponde.
			if (this.cargando_detalle) {
				this.cargando_detalle = false
				this.pedido++
			}
			if (this.timer) {
				clearTimeout(this.timer)
				this.timer = null
			}
			if (this.fallo_pendiente) {
				this.reprogramar_paso_a_mano()
				return
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
		 * escribió otra cosa se descarta (`pedido`). Sin Google o con error: a mano, pero cuando
		 * deje de escribir (`diferir_paso_a_mano`).
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
					avisar_una_vez('google.maps.places no está cargado')
					self.diferir_paso_a_mano('sin_google')
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
				avisar_una_vez('la búsqueda falló', err)
				self.diferir_paso_a_mano('error')
			})
		},
		/**
		 * Google falló mientras el comprador escribía. No se le cambia la pantalla ni se le mueve
		 * el foco en la cara: se espera a que pase `PAUSA_PARA_PASAR_A_MANO_MS` sin teclas (cada
		 * tecla corre la espera, ver `al_escribir`) o a que salga del campo
		 * (`al_salir_del_input`), y recién ahí se pasa a mano.
		 *
		 * @param {string} motivo 'sin_google' o 'error'.
		 */
		diferir_paso_a_mano(motivo) {
			this.fallo_pendiente = motivo
			this.buscando = false
			this.sin_resultados = false
			this.cerrar_sugerencias()
			this.reprogramar_paso_a_mano()
		},
		reprogramar_paso_a_mano() {
			if (this.timer_mano) {
				clearTimeout(this.timer_mano)
				this.timer_mano = null
			}
			let espera = PAUSA_PARA_PASAR_A_MANO_MS - (Date.now() - this.ultima_tecla)
			if (espera <= 0) {
				this.pasar_a_mano(this.fallo_pendiente, true)
				return
			}
			let self = this
			this.timer_mano = setTimeout(function() {
				self.timer_mano = null
				if (self.fase === 'buscar' && self.fallo_pendiente) {
					self.pasar_a_mano(self.fallo_pendiente, true)
				}
			}, espera)
		},
		/**
		 * Salió del campo con Google caído: se pasa a mano ya. El foco se lleva a los campos solo si
		 * no se fue a otro lado (si tocó otro campo de la página, se lo respeta).
		 */
		al_salir_del_input() {
			if (!this.fallo_pendiente) {
				return
			}
			let self = this
			setTimeout(function() {
				if (self.fase !== 'buscar' || !self.fallo_pendiente) {
					return
				}
				let activo = document.activeElement
				self.pasar_a_mano(self.fallo_pendiente, !activo || activo === document.body)
			}, 0)
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
		 * a completar lo que falte. Si el detalle falla, a mano con lo que se sabe de la sugerencia
		 * (ahí no está escribiendo: se pasa enseguida).
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
				self.pasar_a_mano('error', true)
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
		 * calle y altura, si todavía no hay nada cargado, y el cursor queda al final del campo
		 * donde venía escribiendo (la altura si lo último fue un número, si no la calle).
		 *
		 * @param {string} motivo '' (lo pidió el comprador), 'sin_google' o 'error'.
		 * @param {boolean} enfocar Llevar el foco a los campos.
		 */
		pasar_a_mano(motivo, enfocar) {
			let timers = ['timer', 'timer_mano']
			timers.forEach(clave => {
				if (this[clave]) {
					clearTimeout(this[clave])
					this[clave] = null
				}
			})
			this.fallo_pendiente = ''
			this.pedido++
			this.buscando = false
			this.cargando_detalle = false
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
			if (enfocar) {
				this.enfocar_al_final(this.borrador.street_number ? 'street_number' : 'street')
			}
		},
		/**
		 * Vuelve al buscador (desde la tarjeta o desde la carga a mano) con lo escrito antes. Con
		 * `aplicar_solo`, la dirección que estaba aplicada se suelta: ya no es la que se ve.
		 */
		volver_a_buscar() {
			if (this.timer_mano) {
				clearTimeout(this.timer_mano)
				this.timer_mano = null
			}
			this.fallo_pendiente = ''
			this.cargando_detalle = false
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
		 * Foco en un campo con el cursor al final de lo que ya tiene escrito.
		 *
		 * @param {string} clave Clave del contrato (street, street_number...).
		 */
		enfocar_al_final(clave) {
			let id = this.id_base + '-campos-' + clave
			this.$nextTick(function() {
				let campo = document.getElementById(id)
				if (!campo) {
					return
				}
				campo.focus()
				try {
					let largo = campo.value ? campo.value.length : 0
					campo.setSelectionRange(largo, largo)
				} catch (e) {
					// Un input que no admite selección: alcanza con el foco.
				}
			})
		},
		/**
		 * La dirección lista para usar, a partir del borrador (con la altura separada de la calle
		 * si hacía falta).
		 *
		 * La línea (`formatted_address`) es la de Google si trajo la altura; si no (o si se cargó
		 * a mano), se arma con las partes: la de Google sin altura diría "Av. Corrientes, CABA".
		 *
		 * @returns {object}
		 */
		construir() {
			let direccion = normalizar_direccion(this.borrador_efectivo)
			if (this.fase === 'completar' && this.formatted_de_google) {
				direccion.formatted_address = this.formatted_de_google
			} else {
				direccion.formatted_address = armar_formatted_address(direccion)
			}
			return direccion
		},
		/**
		 * Valida y emite la dirección (modo con botón). Si falta algo, se marca en rojo y se dice
		 * qué. Una cargada a mano se intenta geocodificar antes (en silencio, hasta 5 s).
		 */
		confirmar() {
			if (this.ocupado) {
				return
			}
			this.intento_confirmar = true
			// La altura que estaba pegada a la calle se ve separada en sus campos.
			if (this.borrador_efectivo !== this.borrador) {
				this.borrador = this.borrador_efectivo
			}
			if (this.faltantes.length) {
				this.enfocar_primer_faltante()
				return
			}
			let direccion = this.construir()
			if (this.fase !== 'manual' || direccion.lat !== null) {
				this.$emit('confirmar', direccion)
				return
			}
			let self = this
			this.geocodificando = true
			geocodificar(direccion)
			.then(function(coordenadas) {
				self.geocodificando = false
				if (coordenadas) {
					direccion.lat = coordenadas.lat
					direccion.lng = coordenadas.lng
				}
				self.$emit('confirmar', direccion)
			})
		},
		/** Con `aplicar_solo`: aplica la dirección un rato después del último cambio. */
		programar_aplicar() {
			if (this.timer_aplicar) {
				clearTimeout(this.timer_aplicar)
			}
			let self = this
			this.timer_aplicar = setTimeout(function() {
				self.timer_aplicar = null
				self.aplicar_ahora()
			}, DEBOUNCE_APLICAR_MS)
		},
		/**
		 * Con `aplicar_solo`: emite `aplicar` con la dirección si está completa (y cambió desde la
		 * última vez), o con null si dejó de estarlo después de haberse aplicado. Una cargada a mano
		 * se geocodifica después, en silencio: si llegan coordenadas y la dirección sigue siendo la
		 * misma, se vuelve a aplicar con ellas.
		 */
		aplicar_ahora() {
			if (!this.completa) {
				if (this.ultima_aplicada !== '') {
					this.ultima_aplicada = ''
					this.serie_aplicada++
					this.$emit('aplicar', null)
				}
				return
			}
			let direccion = this.construir()
			let firma = JSON.stringify(direccion)
			if (firma === this.ultima_aplicada) {
				return
			}
			this.ultima_aplicada = firma
			let serie = ++this.serie_aplicada
			this.$emit('aplicar', direccion)
			if (this.fase !== 'manual' || direccion.lat !== null) {
				return
			}
			let self = this
			geocodificar(direccion)
			.then(function(coordenadas) {
				if (!coordenadas || serie !== self.serie_aplicada) {
					return
				}
				let con_coordenadas = Object.assign({}, direccion, coordenadas)
				self.ultima_aplicada = JSON.stringify(con_coordenadas)
				self.$emit('aplicar', con_coordenadas)
			})
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

.buscador-direccion__aviso--falta
	margin: .25rem 0 .5rem

.buscador-direccion__lista
	display: flex
	align-items: flex-start
	gap: .45rem
	font-size: .88rem
	font-weight: 600
	color: #1b7a3d
	margin: .25rem 0 .5rem
	overflow-wrap: anywhere

	i
		margin-top: 2px

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
