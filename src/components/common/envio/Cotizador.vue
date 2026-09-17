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
			El formulario de localidad a mano. Desde el 17/9/2026 aparece por DOS motivos muy
			distintos, y por eso el texto de arriba cambia.

			`pide_localidad`: el servidor no pudo resolver el código postal (no existe, o Zipnova
			no devolvió a dónde resolvió). Es el camino de excepción, porque un código postal
			válido se resuelve solo del lado del servidor. Antes de llegar acá se intenta una vez
			más con Google Maps, sin molestar al comprador.

			`corrigiendo_localidad`: el código postal SÍ se resolvió, pero el comprador dice que esa
			no es su localidad (hay códigos postales que cubren varias) y la viene a corregir. Ahí
			no hay ningún error que mostrarle.
		-->
		<div
		v-if="mostrar_localidad_a_mano"
		class="envio-cotizador__localidad">
			<!--
				El error también se muestra en el modo corrección: si el comprador corrigió y la
				re-cotización falló (Zipnova caído, un 502), sin esto se quedaría mirando la
				invitación a corregir sin enterarse de que lo que mandó no llegó a ningún lado.
			-->
			<p
			v-if="pide_localidad || (error && mostrar_error)"
			class="envio-cotizador__error">
				{{ error || 'No reconocimos ese código postal. Decinos la localidad y la provincia.' }}
			</p>

			<p
			v-else
			class="envio-cotizador__destino">
				Decinos tu localidad y tu provincia y volvemos a calcular.
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
			<!--
				A dónde se está cotizando. Desde el 17/9/2026 la localidad la resuelve el servidor
				con el código postal solo, así que esta línea es lo ÚNICO que el comprador tiene
				para darse cuenta si le adivinaron mal: va siempre acompañada de la forma de
				corregirla, porque hay códigos postales que cubren más de una localidad.
			-->
			<p
			v-if="texto_destino"
			class="envio-cotizador__destino">
				{{ texto_destino }}
				<button
				v-if="!mostrar_localidad_a_mano"
				type="button"
				@click="corregir_localidad"
				class="envio-cotizador__link-corregir">
					No es mi localidad
				</button>
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
				<!--
					Ficha con el carrito ya empezado: lo primero que se lee es la DIFERENCIA, no
					el total. El envío es uno solo y el comprador ya lo está pagando; lo que
					decide su compra es cuánto MÁS le sale sumar esto.
				-->
				<p
				v-if="texto_incremental"
				class="envio-cotizador__incremental"
				:class="{'envio-cotizador__incremental--sin-costo': incremental_sin_costo}">
					{{ texto_incremental }}
				</p>

				<envio-opcion-card :opcion="opcion_a_mostrar"></envio-opcion-card>

				<!--
					Y el precio de la tarjeta se aclara: con base, ese número es el envío del
					carrito ENTERO con este producto adentro, no lo que cuesta mandarlo solo.
					Sin esta línea el comprador vuelve a leer el mismo número de antes.
				-->
				<p
				v-if="incremental"
				class="envio-cotizador__envio-completo">
					Es el envío de todo tu carrito, con este producto incluido.
				</p>

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
 * Lo único que vive en el componente son detalles de pantalla (si ya se intentó resolver la
 * localidad con Google Maps, si el comprador abrió el formulario para corregirla).
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
		/**
		 * Líneas que el comprador está por AGREGAR, `[{id, amount}]`, separadas de la base: es la
		 * ficha del artículo con la cantidad que eligió en el selector.
		 *
		 * Con esto el cotizador deja de preguntar "cuánto sale mandar esto" y pasa a preguntar
		 * "cuánto MÁS me sale mandar esto además de lo que ya tengo", que es lo único que el
		 * comprador necesita saber en la ficha: el envío es uno solo y ya lo está pagando. La base
		 * es el carrito del store; con el carrito vacío el costo que se muestra es el completo,
		 * igual que siempre.
		 *
		 * Es excluyente con `articulos`: si vienen las dos, manda esta.
		 */
		articulos_extra: {
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
			/*
			 * El comprador abrió el formulario de localidad por su cuenta, para corregir la que el
			 * servidor resolvió. Es distinto de `needs_location` (ahí el servidor no pudo resolver
			 * nada), y por eso no se guarda en el store: es estado de ESTA pantalla, y el carrito
			 * monta el cotizador dos veces.
			 */
			corrigiendo_localidad: false,
			/* Temporizador de la re-cotización automática al cambiar el carrito. */
			timer_recotizar: null,
			/*
			 * Ids que este cotizador estaba mostrando la última vez que cambió la firma. Sirve
			 * para una sola cosa: distinguir "cambió la CANTIDAD del mismo artículo" (se vuelve a
			 * cotizar solo) de "el comprador se fue a OTRO artículo" (no se cotiza nada que no
			 * pidió). Ver el watcher `firma`.
			 */
			ids_de_la_ficha_anterior: null,
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
		 * Las líneas que le pasaron por la prop `articulos` (la ficha de siempre, sin base).
		 * @returns {Array}
		 */
		lineas_de_la_prop() {
			return this.lineas_normalizadas(this.articulos)
		},
		/**
		 * Las líneas que el comprador está por agregar (prop `articulos_extra`).
		 * @returns {Array}
		 */
		lineas_extra() {
			return this.lineas_normalizadas(this.articulos_extra)
		},
		/**
		 * Se está cotizando una DIFERENCIA y no un envío suelto: hay algo por agregar y esto no
		 * es el carrito ni el checkout.
		 * @returns {boolean}
		 */
		modo_incremental() {
			return !this.usar_carrito && this.lineas_extra.length > 0
		},
		/**
		 * La base de la cotización: lo que el comprador YA tiene. El carrito en el carrito, en el
		 * checkout y también en la ficha cuando hay algo por agregar; las líneas de la prop en la
		 * ficha de siempre. Con el carrito vacío queda vacía, y entonces no hay diferencia que
		 * mostrar: el servidor devuelve `hay_base: false` y se ve el costo completo.
		 * @returns {Array}
		 */
		lineas_base() {
			if (this.usar_carrito || this.modo_incremental) {
				return lineas_del_carrito(this.$store.state.cart.cart)
			}
			return this.lineas_de_la_prop
		},
		/**
		 * Todo lo que se cotiza: la base más lo que se está por agregar.
		 * @returns {Array}
		 */
		lineas() {
			return this.lineas_base.concat(this.lineas_extra)
		},
		/**
		 * Los ids que este cotizador muestra por sí mismo (sin el carrito), para distinguir un
		 * cambio de cantidad de un cambio de artículo. Ver el watcher `firma`.
		 * @returns {string}
		 */
		ids_de_la_ficha() {
			if (this.usar_carrito) {
				return ''
			}
			let ids = []
			this.lineas_de_la_prop.concat(this.lineas_extra).forEach(function(linea) {
				ids.push(String(linea.id))
			})
			return ids.join(',')
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
		/**
		 * El servidor no pudo resolver el destino y lo tiene que escribir el comprador.
		 *
		 * Desde el 17/9/2026 esto es el camino de EXCEPCIÓN y no el de todos los días: el servidor
		 * resuelve la localidad con el código postal solo (ver `ZipnovaCotizadorService` de
		 * tienda-api), y solo manda `needs_location` cuando ese código postal no existe o cuando
		 * Zipnova no devolvió a dónde resolvió.
		 * @returns {boolean}
		 */
		pide_localidad() {
			return this.envio.needs_location && !this.cotizando
		},
		/**
		 * El formulario de localidad a mano está a la vista, lo haya pedido el servidor o el
		 * comprador. Mientras se cotiza una corrección se deja abierto a propósito: el botón de
		 * adentro es el que muestra el spinner.
		 * @returns {boolean}
		 */
		mostrar_localidad_a_mano() {
			return this.pide_localidad || this.corrigiendo_localidad
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
		/**
		 * La opción que se muestra como resumen (artículo y carrito): la más barata, salvo cuando
		 * hay una diferencia a la vista.
		 *
		 * 🔴 Con diferencia se muestra la opción que el servidor comparó (`incremental.key`, la
		 * más barata del carrito buscada en el conjunto), aunque no sea la más barata del
		 * conjunto. Si no, los dos números de la pantalla no cerrarían: "te cuesta $1.007 más"
		 * arriba de una tarjeta de $4.800 cuando el carrito venía pagando $3.993. No se le
		 * esconde nada al comprador: el resto de las opciones están en el modal de siempre.
		 * @returns {object}
		 */
		opcion_a_mostrar() {
			if (this.incremental && this.incremental.key) {
				let comparada = this.opciones_visibles.find(opcion => {
					return opcion.key == this.incremental.key
				})
				if (comparada) {
					return comparada
				}
			}
			return this.opcion_mas_barata
		},
		/**
		 * El bloque `incremental` del servidor, SOLO si corresponde a lo que este cotizador está
		 * mostrando (mismo criterio que `opciones_visibles`) y si hay base contra la cual
		 * comparar. Sin base —carrito vacío, carrito vencido, nada que viaje— no hay diferencia:
		 * lo que se ve es el costo completo, igual que siempre.
		 * @returns {object|null}
		 */
		incremental() {
			if (!this.modo_incremental || !this.opciones_visibles.length) {
				return null
			}
			let incremental = this.envio.incremental
			if (!incremental || !incremental.hay_base) {
				return null
			}
			return incremental
		},
		/**
		 * Cuántas unidades se están por agregar, para hablarle al comprador de lo que eligió y no
		 * de "un producto" cuando puso tres.
		 * @returns {number}
		 */
		unidades_a_agregar() {
			return this.lineas_extra.reduce(function(total, linea) {
				return total + (Number(linea.amount) || 0)
			}, 0)
		},
		/** "este producto" / "estas 3 unidades". @returns {string} */
		texto_lo_que_agrega() {
			return this.unidades_a_agregar > 1
				? 'estas ' + this.unidades_a_agregar + ' unidades'
				: 'este producto'
		},
		/**
		 * La línea que resuelve el problema: cuánto MÁS le cuesta el envío por sumar esto. Tres
		 * casos, y ninguno se puede decir con el número solo:
		 *
		 *   - cuesta una diferencia  → el número, que es lo único que tiene que decidir;
		 *   - no suma nada           → el envío que ya paga alcanza para llevarlo también;
		 *   - lo deja gratis         → la diferencia da NEGATIVA (el envío pasa de $10.000 a $0
		 *     porque con este artículo llega al mínimo de envío gratis), y eso no se muestra
		 *     nunca como "-$10.000".
		 *
		 * 🔴 Con `misma_opcion: false` el servidor avisa que la opción más barata del carrito no
		 * existe en el conjunto (más peso, menos transportistas) y que tuvo que comparar dos
		 * servicios distintos. Ahí el número es una estimación y se dice como tal; y si además no
		 * daría diferencia, no se afirma nada y se muestra el costo completo a secas.
		 *
		 * @returns {string}
		 */
		texto_incremental() {
			let incremental = this.incremental
			if (!incremental) {
				return ''
			}
			if (incremental.queda_gratis) {
				return 'Sumar ' + this.texto_lo_que_agrega + ' te deja el envío gratis.'
			}
			if (incremental.diferencia === null || incremental.diferencia === undefined) {
				return ''
			}
			let diferencia = Number(incremental.diferencia)
			if (!isFinite(diferencia)) {
				return ''
			}
			if (diferencia > 0) {
				return incremental.misma_opcion
					? 'Sumar ' + this.texto_lo_que_agrega + ' a tu envío te cuesta ' + this.price(diferencia, false) + ' más.'
					: 'Sumar ' + this.texto_lo_que_agrega + ' a tu envío te cuesta alrededor de ' + this.price(diferencia, false) + ' más.'
			}
			return incremental.misma_opcion
				? 'Sumar ' + this.texto_lo_que_agrega + ' a tu envío no te cuesta nada más.'
				: ''
		},
		/** La diferencia es buena noticia (gratis o sin costo): se pinta distinto. @returns {boolean} */
		incremental_sin_costo() {
			if (!this.incremental) {
				return false
			}
			if (this.incremental.queda_gratis) {
				return true
			}
			// Sin diferencia calculable no se pinta nada de verde: `Number(null)` es 0 y diría
			// que no cuesta nada cuando lo que pasa es que no se sabe.
			if (this.incremental.diferencia === null || this.incremental.diferencia === undefined) {
				return false
			}
			let diferencia = Number(this.incremental.diferencia)
			return isFinite(diferencia) && diferencia <= 0
		},
	},
	watch: {
		/**
		 * Con el carrito: si cambian las líneas (cantidades, un artículo más) las opciones
		 * quedan viejas y se vuelve a cotizar solo, con un respiro para no disparar una
		 * cotización por cada toque del "+".
		 *
		 * En la ficha del artículo: `firma` también cambia al navegar de un artículo a OTRO,
		 * porque `Article.vue` reusa el mismo árbol de componentes (no hay ningún `:key` que
		 * fuerce un remount — confirmado leyendo el archivo). Si no se atendiera acá, la
		 * precarga del código postal guardado de `created()` correría UNA sola vez por sesión
		 * de SPA (la primera ficha que se carga) y nunca más, que es exactamente lo que no se
		 * quiere: el comprador navega de producto en producto todo el tiempo.
		 */
		firma() {
			if (this.usar_carrito) {
				this.programar_recotizacion()
				return
			}

			/*
			 * En la ficha la firma cambia por dos motivos muy distintos, y no se responden igual:
			 *
			 *   - el comprador se fue a OTRO artículo: no se cotiza nada que no haya pedido (cada
			 *     artículo que mira sería una cotización), salvo la excepción de siempre del
			 *     comprador logueado con su código postal guardado;
			 *   - cambió la CANTIDAD del mismo artículo, o cambió el carrito que es su base: lo
			 *     que está a la vista quedó viejo y hay que volver a cotizar, con el mismo respiro
			 *     de 400 ms del carrito para no disparar una cotización por cada toque del "+".
			 *
			 * Solo se recotiza si ya había una cotización a la vista (`items_firma`): a un
			 * visitante que nunca tocó "Calcular" no se le pide nada por cambiar una cantidad.
			 */
			let ids_ahora = this.ids_de_la_ficha
			let mismo_articulo = this.ids_de_la_ficha_anterior !== null && this.ids_de_la_ficha_anterior === ids_ahora
			this.ids_de_la_ficha_anterior = ids_ahora

			if (mismo_articulo && this.envio.items_firma !== null) {
				this.programar_recotizacion()
				return
			}

			this.cotizar_de_nuevo_si_el_buyer_tiene_cp_guardado()
		},
		/**
		 * Otro código postal es otro destino: la corrección que el comprador estaba haciendo era
		 * sobre la localidad del anterior (el store ya le vació `city` y `state`), y dejar el
		 * formulario abierto le pediría una localidad que el servidor todavía no intentó resolver.
		 */
		zipcode() {
			this.corrigiendo_localidad = false
		},
	},
	created() {
		this.ids_de_la_ficha_anterior = this.ids_de_la_ficha

		// Carrito y checkout: si hay código postal y las opciones no son de estas líneas, se
		// cotiza solo. En la página del artículo NO, salvo la excepción de abajo: cada artículo
		// que se mira sería una cotización, y el comprador toca "Calcular" cuando le interesa.
		if (this.usar_carrito) {
			this.cotizar_si_hace_falta()
			return
		}
		this.cotizar_de_nuevo_si_el_buyer_tiene_cp_guardado()
	},
	beforeDestroy() {
		if (this.timer_recotizar) {
			clearTimeout(this.timer_recotizar)
		}
	},
	methods: {
		/**
		 * Líneas `{id, amount}` con la cantidad ya normalizada a un entero de 1 para arriba.
		 *
		 * 🔴 No es una defensa de más. La cantidad de la ficha sale de `articles.amount` del
		 * store, que arranca en '' (cadena vacía) para un artículo que todavía no está en el
		 * carrito y vuelve a quedar en '' después de agregar (lo vacía `add-to-cart/Index.vue`).
		 * Mandar `amount: 0` es un 422 de validación del servidor —`articles.*.amount` exige
		 * min:1—, o sea el cotizador roto sin ninguna explicación en pantalla.
		 *
		 * @param {Array} lista
		 * @returns {Array}
		 */
		lineas_normalizadas(lista) {
			let lineas = []
			;(lista || []).forEach(function(linea) {
				if (!linea || !linea.id) {
					return
				}
				let amount = Math.floor(Number(linea.amount))
				if (!amount || isNaN(amount) || amount < 1) {
					amount = 1
				}
				lineas.push({ id: linea.id, amount: amount })
			})
			return lineas
		},
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
		/**
		 * Ficha del artículo, comprador logueado con código postal guardado en el perfil
		 * (`envio_zipcode`): muestra el envío más barato sin que toque "Calcular", en
		 * CUALQUIER artículo que mire, no solo el primero de la sesión (ver el comentario del
		 * watcher `firma`).
		 *
		 * No pisa un código postal que el comprador ya tenga cargado en esta sesión del
		 * navegador (de este cotizador o de otro: `zipcode` se guarda en `localStorage` y es
		 * compartido) — el perfil es el punto de partida, no una corrección constante. Si el
		 * comprador lo cambió a mano para mandarle un regalo a otra ciudad, `cotizar_si_hace_falta`
		 * sigue cotizando cada artículo con ESE código postal, no con el del perfil.
		 *
		 * No hace nada para un visitante anónimo ni para un buyer sin código postal guardado:
		 * esos dos siguen tocando "Calcular" cuando les interesa, sin ningún cambio.
		 */
		cotizar_de_nuevo_si_el_buyer_tiene_cp_guardado() {
			let buyer = this.$store.state.auth.user
			if (!buyer || !buyer.envio_zipcode) {
				return
			}
			if (!this.zipcode) {
				this.$store.commit('cart/set_envio_zipcode', buyer.envio_zipcode)
				this.$store.commit('cart/set_envio_localidad', { city: buyer.envio_city, state: buyer.envio_state })
			}
			this.cotizar_si_hace_falta()
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

			/*
			 * `articles` es SIEMPRE la base (lo que ya tiene) y `articles_extra` lo que está por
			 * agregar. `cart_id` va cuando el carrito ya está guardado del lado del servidor: es
			 * la base de verdad, con las cantidades y el subtotal que resolvió el servidor, y la
			 * copia local queda como respaldo para el carrito que todavía no se guardó.
			 */
			let payload = { articles: this.lineas_base }
			if (this.modo_incremental) {
				payload.articles_extra = this.lineas_extra
			}
			if ((this.usar_carrito || this.modo_incremental) && this.cart && this.cart.id) {
				payload.cart_id = this.cart.id
			}

			this.$store.dispatch('cart/cotizar_envio', payload)
			.then(function() {
				// Cotizó bien: si venía de una corrección, el formulario ya cumplió y se cierra.
				self.corrigiendo_localidad = false
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
		 * El comprador dice que la localidad que se resolvió no es la suya: se le abre el mismo
		 * formulario de siempre, con lo resuelto ya cargado para que corrija solo lo que está mal.
		 *
		 * La provincia se normaliza al nombre del select (`normalizar_provincia`): Zipnova la
		 * devuelve sin tildes ("Cordoba", "Rio Negro") y con nombres propios ("Capital Federal"),
		 * y sin esto el comprador vería el select vacío aunque el servidor ya la haya resuelto.
		 */
		corregir_localidad() {
			this.corrigiendo_localidad = true
			let provincia = normalizar_provincia(this.envio.state)
			if (provincia && provincia !== this.envio.state) {
				this.$store.commit('cart/set_envio_localidad', { state: provincia })
			}
		},
		/**
		 * Si hay un buyer logueado y lo que se acaba de cotizar (con localidad/provincia YA
		 * resueltas, no `needs_location`) difiere de lo que tiene guardado, lo guarda en su
		 * perfil para la próxima visita. Va acá y no en un solo lugar del carrito/checkout para
		 * cubrir los tres cotizadores (artículo, carrito, checkout) desde donde ya se resuelve la
		 * cotización con éxito. No bloquea ni avisa si falla: es un guardado de conveniencia.
		 *
		 * Desde el 17/9/2026 esto se completa SOLO: `envio.city` y `envio.state` salen de lo que
		 * resolvió el servidor con el código postal, así que `envio_city` / `envio_state` del
		 * perfil se llenan sin que el comprador escriba nada. Antes quedaban vacíos salvo que
		 * hubiera pasado por el formulario de "no reconocimos ese código postal".
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
		 *
		 * 🔴 ESTO NO ES CÓDIGO MUERTO, es el SEGUNDO intento y casi nunca corre. Desde el
		 * 17/9/2026 el servidor resuelve la localidad con el código postal solo (el centinela de
		 * `ZipnovaCotizadorService`), así que un CP válido ya no llega nunca acá: solo se pasa por
		 * este camino cuando Zipnova tampoco lo pudo resolver. Se deja porque el día que Lucas
		 * habilite la facturación del proyecto de Google Cloud —hoy el geocoder devuelve
		 * REQUEST_DENIED para CUALQUIER código postal— vuelve a ser un intento más antes de
		 * molestar al comprador, y no cuesta nada tenerlo.
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

// "No es mi localidad": la salida cuando el código postal resolvió a otro lado. Va pegada al
// destino y en gris con subrayado — tiene que estar SIEMPRE a mano, pero no competir con
// "Calcular" ni con el precio del envío.
.envio-cotizador__link-corregir
	display: inline
	margin-left: .35rem
	padding: 0
	border: none
	background: none
	font-size: .82rem
	font-weight: 600
	color: rgba(0, 0, 0, .55)
	text-decoration: underline
	text-underline-offset: 2px
	cursor: pointer

	&:hover,
	&:focus
		color: var(--secondary-color, #0d6efd)

// La diferencia que el comprador paga por sumar este producto a un envío que ya tiene. Va ARRIBA
// de la tarjeta y con más peso que el resto: es el número que decide la compra, y el de la
// tarjeta (el envío del carrito entero) es el que ya venía pagando.
.envio-cotizador__incremental
	font-size: .95rem
	font-weight: 700
	line-height: 1.35
	color: #1a1a1a
	margin: 0 0 .5rem

// Buena noticia (no suma nada, o queda gratis): el mismo verde del precio gratis de la tarjeta.
.envio-cotizador__incremental--sin-costo
	color: #1b7a3d

.envio-cotizador__envio-completo
	font-size: .82rem
	color: rgba(0, 0, 0, .55)
	margin: .4rem 0 0

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
