<template>
	<div
	v-if="cant_cart_items > 0"
	class="cart-summary">
		<!-- Contadores: productos distintos y unidades totales -->
		<div class="cart-summary__stats">
			<div class="cart-summary__stat">
				<span class="cart-summary__stat-value">{{ cart_unique_products_count }}</span>
				<span class="cart-summary__stat-label">{{ cart_products_label }}</span>
			</div>
			<div
			class="cart-summary__stat-divider"
			aria-hidden="true"></div>
			<div class="cart-summary__stat">
				<span class="cart-summary__stat-value">{{ cant_cart_items }}</span>
				<span class="cart-summary__stat-label">{{ cart_units_label }}</span>
			</div>
		</div>

		<!-- Total del pedido -->
		<div class="cart-summary__total-row">
			<span class="cart-summary__total-label">Total</span>
			<span class="cart-summary__total-value">{{ price(total) }}</span>
		</div>

		<!-- Acción principal -->
		<b-button
		block
		size="lg"
		variant="success"
		class="cart-summary__btn-primary"
		@click="next">
			<i
			class="bi bi-bag-check cart-summary__btn-icon"
			aria-hidden="true"></i>
			Iniciar compra
		</b-button>

		<!-- Acciones secundarias en una misma fila -->
		<div class="cart-summary__secondary-row">
			<b-button
			class="cart-summary__btn-secondary"
			:to="{ name: 'Home' }">
				<i
				class="bi bi-arrow-left cart-summary__btn-icon"
				aria-hidden="true"></i>
				<span class="cart-summary__btn-text">Seguir comprando</span>
			</b-button>
			<b-button
			class="cart-summary__btn-clear"
			@click="limpiar">
				<i
				class="bi bi-trash cart-summary__btn-icon"
				aria-hidden="true"></i>
				<span class="cart-summary__btn-text">Limpiar carrito</span>
			</b-button>
		</div>
	</div>
</template>
<script>
import cart from '@/mixins/cart'

/**
 * Pie del carrito: resumen con contadores, total y acciones de compra/navegación.
 */
export default {
	name: 'CartFooter',
	mixins: [cart],
	methods: {
		/**
		 * Avanza al checkout o redirige a login si la tienda exige registro.
		 */
		next() {
			if (this.authenticated) {
				if (this.canMakeOrder()) {
					this.$router.push({ name: 'Payment' })
					this.$scrollToTop()
				}
			} else {
				if (this.commerce.online_configuration.register_to_buy) {
					this.$cookies.set('redirect_to', 'Payment')
					this.$router.push({ name: 'Login' })
				} else {
					this.$router.push({ name: 'Payment' })
				}
			}
		},
		/**
		 * Elimina el carrito persistido en el servidor y limpia el store local.
		 */
		limpiar() {
			if (confirm('¿Seguro que quiere limpiar el carrito?')) {
				this.$store.commit('auth/setMessage', 'Cargando')
				this.$store.commit('auth/setLoading', true)
				this.$api.delete('carts/' + this.cart.id)
					.then(() => {
						this.$store.commit('cart/setCart', null)
						this.$store.commit('auth/setLoading', false)
						this.$toast.success('Carrito eliminado')
					})
					.catch(err => {
						this.$store.commit('auth/setLoading', false)
						this.$toast.error(err)
					})
			}
		},
	},
}
</script>
<style lang="sass">
.cart-summary
	display: flex
	flex-direction: column
	gap: 1rem

/* Bloque de contadores (productos distintos | unidades) */
.cart-summary__stats
	display: flex
	align-items: center
	justify-content: center
	gap: 1.25rem
	padding: 0.85rem 1rem
	background: color-mix(in srgb, var(--secondary-color) 8%, #f8f9fa)
	border-radius: 10px
	border: 1px solid rgba(0, 0, 0, 0.05)

.cart-summary__stat
	display: flex
	flex-direction: column
	align-items: center
	text-align: center
	flex: 1

.cart-summary__stat-value
	font-size: 1.35rem
	font-weight: 700
	color: #1a1a1a
	line-height: 1.2

.cart-summary__stat-label
	font-size: 0.78rem
	font-weight: 600
	text-transform: uppercase
	letter-spacing: 0.06em
	color: #666
	margin-top: 0.15rem

.cart-summary__stat-divider
	width: 1px
	align-self: stretch
	background: rgba(0, 0, 0, 0.1)
	flex-shrink: 0

/* Fila del total */
.cart-summary__total-row
	display: flex
	align-items: baseline
	justify-content: space-between
	padding: 0.15rem 0.1rem 0

.cart-summary__total-label
	font-size: 0.85rem
	font-weight: 600
	text-transform: uppercase
	letter-spacing: 0.08em
	color: #666

.cart-summary__total-value
	font-size: 1.45rem
	font-weight: 700
	color: #1a1a1a
	line-height: 1.2

/* Botón principal */
.cart-summary__btn-primary
	font-weight: 600
	border-radius: 10px
	padding-top: 0.7rem
	padding-bottom: 0.7rem
	display: inline-flex
	align-items: center
	justify-content: center
	gap: 0.45rem

/* Fila de acciones secundarias */
.cart-summary__secondary-row
	display: flex
	gap: 0.6rem

.cart-summary__btn-secondary,
.cart-summary__btn-clear
	flex: 1 1 0
	min-width: 0
	font-weight: 600
	font-size: 0.88rem
	border-radius: 10px
	padding: 0.55rem 0.5rem
	display: inline-flex
	align-items: center
	justify-content: center
	gap: 0.35rem
	line-height: 1.25
	white-space: normal

.cart-summary__btn-secondary
	color: #444 !important
	background: #f3f4f6 !important
	border: 1px solid rgba(0, 0, 0, 0.08) !important

	&:hover,
	&:focus
		background: #e9ecef !important
		color: #1a1a1a !important
		border-color: rgba(0, 0, 0, 0.12) !important

.cart-summary__btn-clear
	color: #b42318 !important
	background: #fff !important
	border: 1px solid rgba(180, 35, 24, 0.35) !important

	&:hover,
	&:focus
		background: rgba(180, 35, 24, 0.06) !important
		color: #912018 !important
		border-color: rgba(180, 35, 24, 0.5) !important

.cart-summary__btn-icon
	font-size: 1rem
	flex-shrink: 0

.cart-summary__btn-text
	text-align: center

@media (max-width: 575px)
	.cart-summary__btn-text
		font-size: 0.82rem

	.cart-summary__secondary-row
		gap: 0.45rem
</style>
