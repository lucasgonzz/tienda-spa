<template>
	<div
	:class="popup_mode ? 'last-article--popup' : 'last-article--compact'"
	class="last-article">
		<!-- Producto agregado -->
		<div class="last-article__product">
			<img
			class="last-article__image"
			:src="articleImage(article)"
			:alt="article.name">
			<div class="last-article__product-body">
				<p class="last-article__name">
					{{ article.name }}
				</p>
				<p class="last-article__qty-price">
					{{ line_amount }} x {{ line_unit_price }}
				</p>
			</div>
		</div>

		<template v-if="popup_mode">
			<!-- Resumen del carrito -->
			<div class="last-article__summary">
				<div class="last-article__stats">
					<span class="last-article__stat">
						<strong>{{ cart_unique_products_count }}</strong>
						{{ cart_products_label }}
					</span>
					<span
					class="last-article__stat-separator"
					aria-hidden="true">·</span>
					<span class="last-article__stat">
						<strong>{{ cant_cart_items }}</strong>
						{{ cart_units_label }}
					</span>
				</div>
				<div class="last-article__total-row">
					<span class="last-article__total-label">Total</span>
					<span class="last-article__total-value">{{ price(total) }}</span>
				</div>
			</div>

			<b-button
			block
			variant="success"
			class="last-article__btn-cart"
			@click="_toCart">
				<i
				class="bi bi-cart3 last-article__btn-icon"
				aria-hidden="true"></i>
				Ver carrito
			</b-button>
		</template>
	</div>
</template>
<script>
import cart from '@/mixins/cart'
import nav from '@/mixins/nav'

/**
 * Detalle del último ítem agregado al carrito.
 * Modo popup (navbar): resumen y acción Ver carrito.
 * Modo compacto (checkout): solo fila del producto.
 */
export default {
	mixins: [nav, cart],
	props: {
		/** Artículo o promo mostrada en la tarjeta */
		article: Object,
		/**
		 * Si true, muestra resumen del carrito y botón Ver carrito (popup del navbar).
		 * @type {boolean}
		 */
		show_added_info: {
			type: Boolean,
			default: true,
		},
	},
	computed: {
		/**
		 * Indica si se renderiza la variante completa del popup.
		 * @returns {boolean}
		 */
		popup_mode() {
			return this.show_added_info
		},
		/**
		 * Cantidad de la línea agregada (pivot o amount del artículo).
		 * @returns {number|string}
		 */
		line_amount() {
			if (this.article.pivot && this.article.pivot.amount != null) {
				return this.article.pivot.amount
			}
			return this.article.amount
		},
		/**
		 * Precio unitario formateado de la línea agregada.
		 * @returns {string}
		 */
		line_unit_price() {
			return this.articlePriceEfectivo(this.article)
		},
	},
	methods: {
		/**
		 * Cierra el popup y navega a la vista del carrito.
		 */
		_toCart() {
			this.$emit('close')
			this.$store.commit('cart/set_added_item_popup_visible', false)
			this.toCart()
		},
	},
}
</script>
<style lang="sass">
.last-article__product
	display: flex
	align-items: flex-start
	gap: 0.75rem

.last-article__image
	width: 56px
	height: 56px
	object-fit: contain
	border-radius: 8px
	background: #f8f9fa
	border: 1px solid rgba(0, 0, 0, 0.06)
	flex-shrink: 0

.last-article__product-body
	min-width: 0
	flex: 1

.last-article__name
	text-align: left
	font-size: 0.88rem
	font-weight: 600
	color: #1a1a1a
	line-height: 1.35
	margin-bottom: 0.35rem
	display: -webkit-box
	-webkit-line-clamp: 2
	-webkit-box-orient: vertical
	overflow: hidden

.last-article__qty-price
	text-align: left
	font-size: 0.82rem
	color: #666
	margin-bottom: 0

/* Resumen del carrito dentro del popup */
.last-article--popup .last-article__summary
	margin-top: 0.85rem
	padding: 0.7rem 0.75rem
	background: color-mix(in srgb, var(--secondary-color) 8%, #f8f9fa)
	border-radius: 10px
	border: 1px solid rgba(0, 0, 0, 0.05)

.last-article__stats
	display: flex
	align-items: center
	flex-wrap: wrap
	gap: 0.35rem
	font-size: 0.78rem
	color: #666
	margin-bottom: 0.5rem

.last-article__stat strong
	color: #1a1a1a
	font-weight: 700

.last-article__stat-separator
	color: rgba(0, 0, 0, 0.25)

.last-article__total-row
	display: flex
	align-items: baseline
	justify-content: space-between

.last-article__total-label
	font-size: 0.78rem
	font-weight: 600
	text-transform: uppercase
	letter-spacing: 0.06em
	color: #666

.last-article__total-value
	font-size: 1.15rem
	font-weight: 700
	color: #1a1a1a

/* Botón principal del popup */
.last-article__btn-cart
	margin-top: 0.65rem
	font-weight: 600
	border-radius: 10px
	padding-top: 0.55rem
	padding-bottom: 0.55rem
	display: inline-flex
	align-items: center
	justify-content: center
	gap: 0.4rem

.last-article__btn-icon
	font-size: 1rem

/* Variante compacta (resumen de pago) */
.last-article--compact
	.last-article__name
		font-size: 0.9rem

	.last-article__qty-price
		font-size: 0.85rem
</style>
