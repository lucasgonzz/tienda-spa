<template>
	<transition name="mini-cart-popup-fade">
		<div
		v-if="is_visible && added_item"
		:class="register_to_buy_modifier"
		class="mini-cart-popup"
		@click.stop>
			<!-- Encabezado: confirmación y cierre manual con anillo de tiempo -->
			<div class="mini-cart-popup__header">
				<div class="mini-cart-popup__success">
					<span
					class="mini-cart-popup__success-badge"
					aria-hidden="true">
						<i class="bi bi-check-lg mini-cart-popup__success-check"></i>
					</span>
					<span class="mini-cart-popup__success-text">Agregado al carrito</span>
				</div>
				<button
				type="button"
				class="mini-cart-popup__close"
				aria-label="Cerrar notificación"
				@click.stop="close">
					<svg
					class="mini-cart-popup__close-ring"
					viewBox="0 0 36 36"
					aria-hidden="true">
						<circle
						class="mini-cart-popup__close-ring-bg"
						cx="18"
						cy="18"
						:r="close_ring_radius"
						fill="none"
						stroke-width="2.5"></circle>
						<circle
						:key="'close-ring-' + auto_close_animation_key"
						class="mini-cart-popup__close-ring-progress"
						cx="18"
						cy="18"
						:r="close_ring_radius"
						fill="none"
						stroke-width="2.5"
						:style="close_ring_animation_style"
						@animationend="on_close_ring_animation_end"></circle>
					</svg>
					<span class="mini-cart-popup__close-inner">
						<i
						class="bi bi-x-lg mini-cart-popup__close-icon"
						aria-hidden="true"></i>
					</span>
				</button>
			</div>

			<last-article
			:article="added_item"
			@close="close"></last-article>
		</div>
	</transition>
</template>
<script>
/** Duración visible del popup antes del cierre automático (segundos). */
const AUTO_CLOSE_SECONDS = 5

/** Radio del círculo SVG del anillo de cierre (viewBox 36×36). */
const CLOSE_RING_RADIUS = 15

/**
 * Tarjeta flotante del navbar al agregar un producto al carrito.
 * Gestiona visibilidad reactiva y animación de cierre automático en el botón X.
 */
export default {
	components: {
		LastArticle: () => import('@/components/nav/right-buttons/cart-btn/LastArticle'),
	},
	data() {
		return {
			/** Clave para reiniciar la animación CSS del anillo al reabrir o re-agregar */
			auto_close_animation_key: 0,
			/** Referencia al timeout de cierre automático */
			auto_close_timeout_id: null,
		}
	},
	computed: {
		/**
		 * Carrito actual del store.
		 * @returns {object|null}
		 */
		cart() {
			return this.$store.state.cart.cart
		},
		/**
		 * Último ítem agregado al carrito.
		 * @returns {object|null}
		 */
		added_item() {
			return this.$store.state.cart.added_item
		},
		/**
		 * Indica si el popup debe mostrarse.
		 * @returns {boolean}
		 */
		is_visible() {
			return this.$store.state.cart.added_item_popup_visible
		},
		/**
		 * Modificador de posición cuando la tienda exige registro para comprar.
		 * @returns {string}
		 */
		register_to_buy_modifier() {
			if (
				this.commerce
				&& this.commerce.online_configuration
				&& this.commerce.online_configuration.register_to_buy
			) {
				return 'mini-cart-popup--register-to-buy'
			}
			return ''
		},
		/**
		 * Radio del anillo del botón cerrar (expuesto al template).
		 * @returns {number}
		 */
		close_ring_radius() {
			return CLOSE_RING_RADIUS
		},
		/**
		 * Longitud del trazo del círculo para stroke-dasharray/offset.
		 * @returns {number}
		 */
		close_ring_circumference() {
			return 2 * Math.PI * CLOSE_RING_RADIUS
		},
		/**
		 * Estilos inline del anillo: duración de la animación y perímetro del círculo.
		 * @returns {object}
		 */
		close_ring_animation_style() {
			return {
				animationDuration: AUTO_CLOSE_SECONDS + 's',
				strokeDasharray: this.close_ring_circumference,
				strokeDashoffset: 0,
			}
		},
	},
	watch: {
		/**
		 * Reinicia el temporizador cada vez que se abre el popup.
		 * @param {boolean} visible
		 */
		is_visible(visible) {
			if (visible) {
				this.start_auto_close()
			} else {
				this.clear_auto_close()
			}
		},
		/**
		 * Si se agrega otro ítem con el popup abierto, reinicia la animación.
		 * @param {object|null} new_val
		 */
		added_item(new_val) {
			if (new_val && this.is_visible) {
				this.start_auto_close()
			}
		},
	},
	beforeDestroy() {
		this.clear_auto_close()
	},
	methods: {
		/**
		 * Oculta la tarjeta flotante y detiene el cierre automático.
		 */
		close() {
			this.$store.commit('cart/set_added_item_popup_visible', false)
			this.clear_auto_close()
		},
		/**
		 * Reinicia la animación del anillo y programa el cierre a los 5 s.
		 */
		start_auto_close() {
			this.clear_auto_close()
			this.auto_close_animation_key += 1

			this.auto_close_timeout_id = setTimeout(() => {
				this.close()
			}, AUTO_CLOSE_SECONDS * 1000)
		},
		/**
		 * Limpia el timeout activo de cierre automático.
		 */
		clear_auto_close() {
			if (this.auto_close_timeout_id) {
				clearTimeout(this.auto_close_timeout_id)
				this.auto_close_timeout_id = null
			}
		},
		/**
		 * Respaldo por si el timeout no dispara: cierra al terminar la animación del anillo.
		 */
		on_close_ring_animation_end() {
			if (this.is_visible) {
				this.close()
			}
		},
	},
}
</script>
<style lang="sass">
.mini-cart-popup-fade-enter-active,
.mini-cart-popup-fade-leave-active
	transition: opacity 0.2s ease, transform 0.2s ease

.mini-cart-popup-fade-enter,
.mini-cart-popup-fade-leave-to
	opacity: 0
	transform: translateY(-6px)

.mini-cart-popup
	cursor: default
	z-index: 200
	position: absolute
	top: calc(100% + 12px)
	right: 0
	width: 340px
	max-width: calc(100vw - 24px)
	background: #fff
	border-radius: 14px
	padding: 0.85rem 1rem 1rem
	box-shadow: 0 12px 36px rgba(0, 0, 0, 0.14)
	border: 1px solid rgba(0, 0, 0, 0.07)
	border-top: 3px solid var(--secondary-color)
	color: #1a1a1a
	text-align: left

	&::before
		position: absolute
		display: block
		content: ''
		width: 0
		height: 0
		top: -9px
		right: 18px
		border-left: 9px solid transparent
		border-right: 9px solid transparent
		border-bottom: 9px solid var(--secondary-color)

	&::after
		position: absolute
		display: block
		content: ''
		width: 0
		height: 0
		top: -6px
		right: 19px
		border-left: 8px solid transparent
		border-right: 8px solid transparent
		border-bottom: 8px solid #fff

.mini-cart-popup--register-to-buy
	right: -59px

	&::before,
	&::after
		right: auto
		left: calc(84% - 8px)

.mini-cart-popup__header
	display: flex
	align-items: center
	justify-content: space-between
	gap: 0.5rem
	margin-bottom: 0.75rem
	padding-bottom: 0.65rem
	border-bottom: 1px solid rgba(0, 0, 0, 0.07)

.mini-cart-popup__success
	display: flex
	align-items: center
	gap: 0.55rem
	min-width: 0

/* Ícono de éxito: círculo verde sólido con check blanco */
.mini-cart-popup__success-badge
	display: inline-flex
	align-items: center
	justify-content: center
	width: 28px
	height: 28px
	border-radius: 50%
	background: #157347
	flex-shrink: 0
	box-shadow: 0 2px 6px rgba(21, 115, 71, 0.35)

.mini-cart-popup__success-check
	color: #fff !important
	font-size: 1rem !important
	font-weight: 700
	line-height: 1

.mini-cart-popup__success-text
	font-size: 0.92rem
	font-weight: 700
	color: #1a1a1a !important
	line-height: 1.25

/* Botón cerrar con anillo que se consume según el tiempo restante */
.mini-cart-popup__close
	position: relative
	display: inline-flex
	align-items: center
	justify-content: center
	width: 36px
	height: 36px
	padding: 0
	border: none
	background: transparent
	cursor: pointer
	flex-shrink: 0

	&:hover .mini-cart-popup__close-inner,
	&:focus .mini-cart-popup__close-inner
		background: #e9ecef

	&:focus
		outline: none

	&:focus .mini-cart-popup__close-inner
		box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.12)

.mini-cart-popup__close-ring
	position: absolute
	inset: 0
	width: 100%
	height: 100%
	transform: rotate(-90deg)
	pointer-events: none

.mini-cart-popup__close-ring-bg
	stroke: rgba(0, 0, 0, 0.12)

.mini-cart-popup__close-ring-progress
	stroke: #157347
	stroke-linecap: round
	animation-name: mini-cart-close-ring-deplete
	animation-timing-function: linear
	animation-fill-mode: forwards

@keyframes mini-cart-close-ring-deplete
	from
		stroke-dashoffset: 0
	to
		stroke-dashoffset: 94.25

.mini-cart-popup__close-inner
	position: relative
	z-index: 1
	display: inline-flex
	align-items: center
	justify-content: center
	width: 28px
	height: 28px
	border-radius: 50%
	background: #fff
	border: 1px solid rgba(0, 0, 0, 0.1)
	transition: background 0.15s ease

.mini-cart-popup__close-icon
	color: #000 !important
	font-size: 0.85rem !important
	font-weight: 700
	line-height: 1
	opacity: 1 !important

/* Anula estilos heredados del botón del navbar (.btn-carrito i { color: white }) */
.btn-carrito .mini-cart-popup
	color: #1a1a1a

	p, span, strong
		color: inherit

	.mini-cart-popup__close-icon
		color: #000 !important
		opacity: 1 !important

	.mini-cart-popup__success-text
		color: #1a1a1a !important

	.last-article__name,
	.last-article__total-value
		color: #1a1a1a !important

	.last-article__qty-price,
	.last-article__stat,
	.last-article__total-label
		color: #666 !important
</style>
