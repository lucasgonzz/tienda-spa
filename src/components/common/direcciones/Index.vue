<template>
	<div class="direcciones">

		<!-- ── Con la lista de la cuenta (comprador logueado) ─────────────────────────────── -->
		<template v-if="usa_lista">
			<p
			v-if="cargando_lista"
			class="direcciones__estado">
				<b-spinner
				small
				class="m-r-10"></b-spinner>
				Cargando tus direcciones...
			</p>

			<p
			v-else-if="error_de_lista"
			class="direcciones__estado direcciones__estado--error">
				{{ error_de_lista }}
			</p>

			<template v-else>
				<buscador-direccion
				v-if="mostrar_buscador"
				:pide_codigo_postal="pide_codigo_postal"
				:cancelable="direcciones.length > 0"
				:guardando="guardando"
				:texto_confirmar="modo === 'checkout' ? 'Guardar y usar esta dirección' : 'Guardar dirección'"
				@confirmar="guardar_nueva"
				@cancelar="agregando = false"></buscador-direccion>

				<template v-else>
					<div
					:role="modo === 'checkout' ? 'radiogroup' : null"
					:aria-label="modo === 'checkout' ? 'Dirección de entrega' : null"
					class="direcciones__lista">
						<tarjeta-direccion
						v-for="direccion in direcciones"
						:key="direccion.id"
						:direccion="direccion"
						:seleccionable="modo === 'checkout'"
						:elegida="modo === 'checkout' && es_la_elegida(direccion)"
						@elegir="elegir(direccion)">
							<template
							v-if="modo === 'cuenta'"
							#acciones>
								<b-button
								v-if="!direccion.is_default"
								size="sm"
								variant="outline-secondary"
								:disabled="ocupado"
								class="direcciones__accion"
								@click="hacer_principal(direccion)">
									<b-spinner
									v-if="marcando_id === direccion.id"
									small></b-spinner>
									<span v-else>Hacer principal</span>
								</b-button>
								<b-button
								size="sm"
								variant="outline-danger"
								:disabled="ocupado"
								class="direcciones__accion"
								@click="borrar(direccion)">
									<b-spinner
									v-if="borrando_id === direccion.id"
									small></b-spinner>
									<span v-else>Borrar</span>
								</b-button>
							</template>
						</tarjeta-direccion>
					</div>

					<button
					v-if="puede_agregar"
					type="button"
					class="direcciones__agregar"
					@click="agregando = true">
						<i class="bi bi-plus-circle"></i>
						{{ direcciones.length ? 'Agregar otra dirección' : 'Agregar una dirección' }}
					</button>
					<p
					v-else-if="direcciones.length"
					class="direcciones__estado">
						Llegaste al máximo de {{ maximo }} direcciones. Para sumar otra, borrá alguna{{ modo === 'checkout' ? ' desde Mi cuenta → Mis direcciones' : '' }}.
					</p>
				</template>
			</template>
		</template>

		<!-- ── Una sola dirección para este pedido (invitado, vendedor, o sin lista) ────────── -->
		<template v-else>
			<p
			v-if="aviso_sin_lista"
			class="direcciones__estado">
				{{ aviso_sin_lista }}
			</p>

			<buscador-direccion
			v-if="!value || agregando"
			:pide_codigo_postal="pide_codigo_postal"
			:cancelable="!!value"
			@confirmar="usar_para_este_pedido"
			@cancelar="agregando = false"></buscador-direccion>

			<template v-else>
				<tarjeta-direccion
				:direccion="value"
				elegida></tarjeta-direccion>
				<button
				type="button"
				class="direcciones__agregar"
				@click="agregando = true">
					<i class="bi bi-pencil"></i>
					Cambiar la dirección
				</button>
			</template>
		</template>
	</div>
</template>
<script>
import BuscadorDireccion from '@/components/common/direcciones/BuscadorDireccion'
import TarjetaDireccion from '@/components/common/direcciones/TarjetaDireccion'
import { snapshot_de_guardada, renglon_de_la_calle, MAXIMO_DE_DIRECCIONES } from '@/helpers/direcciones'
import { mensaje_de_error } from '@/store/buyer_addresses'

/**
 * Direcciones del comprador: la lista de la cuenta y el buscador para agregar, o una sola
 * dirección para el pedido (misión formas-envio-direcciones-maps, 19/10/2026). Orquesta
 * BuscadorDireccion (Google Places + carga a mano) y TarjetaDireccion.
 *
 * Dos modos (`modo`):
 *
 *   - `checkout` (bloque "¿A dónde te lo enviamos?"): v-model con la dirección elegida para el
 *     pedido (forma del contrato).
 *       · Con `guardar_en_la_cuenta` (comprador logueado): sus direcciones como opciones, con la
 *         principal elegida sola; "Agregar otra dirección" abre el buscador, y lo confirmado se
 *         guarda con `POST /api/buyer/addresses` y queda elegido. Sin ninguna guardada, el
 *         buscador abierto de entrada.
 *       · Sin `guardar_en_la_cuenta` (invitado, o vendedor cargando el pedido de un cliente): el
 *         buscador para UNA dirección, que no se guarda en ninguna lista; confirmada, se ve en
 *         una tarjeta con "Cambiar la dirección".
 *   - `cuenta` ("Mi cuenta → Mis direcciones"): la lista con "Hacer principal" y "Borrar", y
 *     "Agregar una dirección".
 *
 * 🔴 La compra no puede quedar trabada por esto: si la lista no se puede traer en el checkout
 * (la base sin la tabla, `sin_direcciones`, o cualquier otro error), o si una dirección nueva no
 * se puede guardar por `sin_direcciones`, el bloque pasa al modo de una sola dirección y el
 * comprador la carga para este pedido igual (el carrito la manda completa).
 */
export default {
	name: 'Direcciones',
	components: {
		BuscadorDireccion,
		TarjetaDireccion,
	},
	props: {
		/** 'checkout' o 'cuenta'. */
		modo: {
			type: String,
			default: 'checkout',
		},
		/** La dirección elegida para el pedido (solo `checkout`). */
		value: {
			type: Object,
			default: null,
		},
		/** Usar (y guardar en) la lista de la cuenta del comprador logueado. */
		guardar_en_la_cuenta: {
			type: Boolean,
			default: false,
		},
		/** El código postal es obligatorio (la tienda cotiza por correo con Zipnova). */
		pide_codigo_postal: {
			type: Boolean,
			default: false,
		},
	},
	data() {
		return {
			/* El buscador está abierto para agregar (o cambiar) una dirección. */
			agregando: false,
			/* Se está guardando una dirección nueva en la cuenta. */
			guardando: false,
			/* La lista no se pudo traer o no se puede usar: en el checkout se sigue con una sola. */
			sin_lista: false,
			aviso_sin_lista: '',
			/* Error al traer la lista (solo en `cuenta`, donde no hay a qué volver). */
			error_de_lista: '',
			borrando_id: null,
			marcando_id: null,
			maximo: MAXIMO_DE_DIRECCIONES,
		}
	},
	computed: {
		usa_lista() {
			return this.guardar_en_la_cuenta && !this.sin_lista
		},
		direcciones() {
			return this.$store.state.buyer_addresses.models
		},
		/**
		 * Si la lista del store es la de ESTE comprador (se carga una vez por comprador).
		 *
		 * @returns {boolean}
		 */
		lista_cargada() {
			let user = this.$store.state.auth.user
			return !!(user && this.$store.state.buyer_addresses.cargada_para === user.id)
		},
		cargando_lista() {
			return !this.lista_cargada && !this.error_de_lista
		},
		mostrar_buscador() {
			return this.agregando || !this.direcciones.length
		},
		puede_agregar() {
			return this.direcciones.length < MAXIMO_DE_DIRECCIONES
		},
		ocupado() {
			return this.borrando_id !== null || this.marcando_id !== null
		},
	},
	watch: {
		/* Una lista nueva (se cargó, se agregó o se borró una): que haya una elegida. */
		direcciones() {
			this.elegir_principal_si_hace_falta()
		},
		/* La soltó el carrito (un 422 `direccion`, o el servidor la limpió): se vuelve a elegir. */
		value() {
			this.elegir_principal_si_hace_falta()
		},
		/* Inició sesión en el medio: se pasa a la lista de la cuenta. */
		guardar_en_la_cuenta(valor) {
			if (valor) {
				this.sin_lista = false
				this.aviso_sin_lista = ''
				this.cargar_si_hace_falta()
			}
		},
	},
	created() {
		this.cargar_si_hace_falta()
		this.elegir_principal_si_hace_falta()
	},
	methods: {
		/**
		 * Trae la lista de la cuenta si no está cargada para este comprador.
		 */
		cargar_si_hace_falta() {
			if (!this.usa_lista || this.lista_cargada) {
				return
			}
			let self = this
			this.error_de_lista = ''
			this.$store.dispatch('buyer_addresses/fetch')
			.catch(function(err) {
				console.log(err)
				if (self.modo === 'checkout') {
					// Sin la lista se sigue igual: una dirección para este pedido.
					self.sin_lista = true
					self.aviso_sin_lista = 'No pudimos traer tus direcciones guardadas. Cargá la dirección para este pedido.'
					return
				}
				self.error_de_lista = mensaje_de_error(err)
			})
		},
		/**
		 * Checkout con la lista: si no hay una dirección elegida que esté en la lista, se elige la
		 * principal (o la primera). Si la lista quedó vacía, se suelta la que hubiera: el buscador
		 * se abre solo y lo que se mande tiene que ser lo que el comprador ve.
		 */
		elegir_principal_si_hace_falta() {
			if (this.modo !== 'checkout' || !this.usa_lista || !this.lista_cargada) {
				return
			}
			let actual = this.value
			if (actual && actual.buyer_address_id && this.direcciones.some(direccion => direccion.id === actual.buyer_address_id)) {
				return
			}
			let principal = this.direcciones.find(direccion => direccion.is_default) || this.direcciones[0]
			if (principal) {
				this.elegir(principal)
			} else if (actual) {
				this.$emit('input', null)
			}
		},
		/**
		 * @param {object} direccion
		 * @returns {boolean}
		 */
		es_la_elegida(direccion) {
			return !!(this.value && this.value.buyer_address_id === direccion.id)
		},
		/**
		 * Elige una dirección guardada para el pedido.
		 *
		 * @param {object} direccion
		 */
		elegir(direccion) {
			if (this.es_la_elegida(direccion)) {
				return
			}
			this.$emit('input', snapshot_de_guardada(direccion))
		},
		/**
		 * Guarda en la cuenta la dirección que se confirmó en el buscador y, en el checkout, la
		 * elige. Si la base no tiene la tabla (`sin_direcciones`), en el checkout se usa igual
		 * para este pedido.
		 *
		 * @param {object} direccion
		 */
		guardar_nueva(direccion) {
			let self = this
			this.guardando = true
			this.$store.dispatch('buyer_addresses/create', direccion)
			.then(function(guardada) {
				self.guardando = false
				self.agregando = false
				if (self.modo === 'checkout') {
					self.$emit('input', snapshot_de_guardada(guardada))
				}
				self.$toast.success('Guardamos la dirección en tu cuenta')
			})
			.catch(function(err) {
				console.log(err)
				self.guardando = false
				let data = err && err.response && err.response.data ? err.response.data : {}
				if (data.codigo == 'sin_direcciones' && self.modo === 'checkout') {
					self.sin_lista = true
					self.aviso_sin_lista = 'No pudimos guardarla en tu cuenta, pero la usamos para este pedido.'
					self.agregando = false
					self.$emit('input', direccion)
					return
				}
				self.$toast.error(mensaje_de_error(err))
			})
		},
		/**
		 * Invitado (o sin lista): la dirección confirmada es la del pedido, sin guardarse en
		 * ningún lado más que en el carrito.
		 *
		 * @param {object} direccion
		 */
		usar_para_este_pedido(direccion) {
			this.agregando = false
			this.$emit('input', direccion)
		},
		/**
		 * "Mis direcciones": la marca como principal (la que el checkout elige sola).
		 *
		 * @param {object} direccion
		 */
		hacer_principal(direccion) {
			let self = this
			this.marcando_id = direccion.id
			this.$store.dispatch('buyer_addresses/set_default', direccion)
			.then(function() {
				self.marcando_id = null
				self.$toast.success('Listo, es tu dirección principal')
			})
			.catch(function(err) {
				console.log(err)
				self.marcando_id = null
				self.$toast.error(mensaje_de_error(err))
			})
		},
		/**
		 * "Mis direcciones": la borra, después de confirmarlo.
		 *
		 * @param {object} direccion
		 */
		borrar(direccion) {
			let self = this
			this.$bvModal.msgBoxConfirm('¿Borrar la dirección ' + renglon_de_la_calle(direccion) + '?', {
				okTitle: 'Borrar',
				okVariant: 'danger',
				cancelTitle: 'Cancelar',
				centered: true,
			})
			.then(function(confirmado) {
				if (!confirmado) {
					return null
				}
				self.borrando_id = direccion.id
				return self.$store.dispatch('buyer_addresses/delete', direccion.id)
				.then(function() {
					self.borrando_id = null
					self.$toast.success('Dirección borrada')
				})
			})
			.catch(function(err) {
				console.log(err)
				self.borrando_id = null
				self.$toast.error(mensaje_de_error(err))
			})
		},
	},
}
</script>
<style lang="sass">
// Direcciones del comprador (checkout y Mi cuenta). Inputs de 44px también fuera del checkout.
.direcciones
	text-align: left

	.form-control,
	.custom-select
		min-height: 44px
		border-radius: 10px

.direcciones__lista
	margin-bottom: .25rem

	.checkout-option:last-child
		margin-bottom: .6rem

.direcciones__estado
	font-size: .88rem
	color: rgba(0, 0, 0, .6)
	margin: 0 0 .75rem

.direcciones__estado--error
	color: #c0392b
	font-weight: 600

.direcciones__agregar
	display: inline-flex
	align-items: center
	gap: .4rem
	min-height: 44px
	padding: .5rem 0
	background: none
	border: none
	font-size: .92rem
	font-weight: 700
	color: var(--secondary-color, #0d6efd)
	cursor: pointer

.direcciones__accion
	min-height: 36px
	min-width: 6.5rem
	border-radius: 8px
</style>
