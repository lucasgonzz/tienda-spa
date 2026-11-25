<template>
	<!-- @click.stop: ningun clic del cartel (casilla, label, texto) debe subir a la tarjeta, que navega a la ficha -->
	<div
	class="cart-stock-notice"
	@click.stop
	v-if="is_cart_view && (hay_faltante || hay_aviso_agotarse)">
		<!-- Cartel del renglón recortado: lo que agregó originalmente y lo que hay ahora -->
		<div
		v-if="hay_faltante"
		class="cart-stock-notice__faltante">
			<p
			class="cart-stock-notice__texto">
				<i class="bi bi-info-circle"></i>
				{{ texto }}
			</p>

			<!-- Casilla: si está marcada, al reponer se le completa la cantidad original -->
			<b-form-checkbox
			class="cart-stock-notice__casilla"
			:checked="marcada"
			:disabled="guardando"
			@change="cambiar_casilla">
				Completar mi carrito cuando vuelva a haber stock
			</b-form-checkbox>
		</div>

		<!-- Aviso: el producto está en carritos de otros clientes -->
		<p
		v-if="hay_aviso_agotarse"
		class="cart-stock-notice__agotarse">
			Este producto está en el carrito de otros clientes; si mandan su pedido antes, puede agotarse.
		</p>
	</div>
</template>
<script>
import { tiene_faltante, texto_faltante, completar_al_reponer, puede_agotarse } from '@/helpers/ajuste_de_carrito'

export default {
	name: 'CartStockNotice',
	props: {
		// Renglón del carrito (artículo con `pivot`).
		article: Object,
	},
	data() {
		return {
			// Valor mostrado de la casilla mientras se guarda (vuelve al del servidor si falla).
			valor_local: null,
			// Hay un PATCH en vuelo para esta casilla.
			guardando: false,
		}
	},
	computed: {
		/**
		 * El cartel sólo se muestra en el carrito, no en el listado ni en la ficha.
		 * @returns {boolean}
		 */
		is_cart_view() {
			return this.$route.name == 'Cart'
		},
		hay_faltante() {
			return tiene_faltante(this.article)
		},
		hay_aviso_agotarse() {
			return puede_agotarse(this.article)
		},
		texto() {
			return texto_faltante(this.article)
		},
		/**
		 * Valor de la casilla: el local mientras se guarda y, si no, el que manda el servidor.
		 * @returns {boolean}
		 */
		marcada() {
			return this.valor_local === null ? completar_al_reponer(this.article) : this.valor_local
		},
	},
	methods: {
		/**
		 * Guarda el nuevo valor de la casilla. Si la API es anterior (404/405) o falla, la casilla
		 * vuelve a su estado y se avisa con un toast.
		 * @param {boolean} valor nuevo valor tildado por el comprador
		 */
		cambiar_casilla(valor) {
			let self = this
			self.valor_local = !!valor
			self.guardando = true
			self.$store.dispatch('cart/cambiarCompletarAlReponer', { item: self.article, valor: !!valor })
			.then(() => {
				// El carrito nuevo ya trae el valor confirmado.
				self.valor_local = null
			})
			.catch(err => {
				// La casilla vuelve a su estado anterior.
				self.valor_local = null
				self.$forceUpdate()
				if (err && err.api_vieja) {
					self.$toast.error('Actualizá la página e intentá de nuevo')
				} else {
					self.$toast.error('No pudimos guardar el cambio. Probá de nuevo.')
				}
			})
			.finally(() => {
				self.guardando = false
			})
		},
	},
}
</script>
<style lang="sass">
.cart-stock-notice
	width: 100%
	margin-top: 10px
	text-align: left
	font-size: .875rem
	overflow-wrap: anywhere

	.cart-stock-notice__faltante
		padding: 8px 10px
		border-radius: 6px
		background: #fff8e1
		color: #6b5200
		border: 1px solid #f3e1a3

	.cart-stock-notice__texto
		margin: 0 0 6px

	.cart-stock-notice__casilla
		min-height: 24px

	.cart-stock-notice__agotarse
		margin: 8px 0 0
		color: #6b5200
</style>
