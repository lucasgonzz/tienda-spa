<template>
	<transition
	name="promo">
		<div
		v-if="visible"
		class="promo"
		role="dialog"
		aria-modal="true"
		aria-label="Promoción personalizada para vos">

			<div
			class="promo__velo"
			@click="cerrar"></div>

			<div
			class="promo__panel"
			@touchstart="al_empezar_el_gesto"
			@touchend="al_terminar_el_gesto">

				<button
				type="button"
				class="promo__cerrar"
				aria-label="Cerrar"
				@click="cerrar">
					<i class="bi bi-x-lg"></i>
				</button>

				<transition
				:name="direccion_transicion"
				mode="out-in">
					<tarjeta
					v-if="article_actual"
					:key="article_actual.id"
					:article="article_actual"
					@usar="usar_la_promocion"></tarjeta>
				</transition>

				<navegacion
				v-if="articles.length > 1"
				:total="articles.length"
				:indice="indice"
				@ir="ir"
				@anterior="anterior"
				@siguiente="siguiente"></navegacion>

			</div>
		</div>
	</transition>
</template>
<script>
import Tarjeta from '@/components/promocion-personalizada/Tarjeta'
import Navegacion from '@/components/promocion-personalizada/Navegacion'
import { firma_de_ofertas, esta_descartado, marcar_descartado } from '@/utils/promocion_personalizada'

/**
 * El mensaje de la oferta personalizada: una oferta por pantalla, navegable.
 *
 * 🔴 No es un b-modal, y es a proposito: BootstrapVue lo renderiza en un portal al final del
 * <body> con su propio chrome, sus bordes y su boton de cerrar, y encima de eso no se puede
 * construir la estetica que pidio Lucas. Un div propio con <transition> es lo unico que
 * permite las tres capas escalonadas de la entrada.
 *
 * Es tambien la UNICA implementacion del mensaje en todo el SPA: el boton del navbar
 * (PromocionBtn) reabre este mismo overlay en vez de tener una pantalla alternativa.
 */
export default {
	components: {
		Tarjeta,
		Navegacion,
	},
	data() {
		return {
			/* Que transicion usa el cambio de tarjeta, para que el movimiento acompañe el gesto. */
			direccion_transicion: 'promo-siguiente',
			/* Valor que tenia document.body.style.overflow antes de que lo pisaramos. */
			overflow_previo: null,
			/* Punto donde arranco el gesto tactil en curso. */
			toque_x: null,
			toque_y: null,
		}
	},
	computed: {
		articles() {
			return this.$store.state.client_offers.articles
		},
		loaded() {
			return this.$store.state.client_offers.loaded
		},
		loading() {
			return this.$store.state.client_offers.loading
		},
		indice() {
			return this.$store.state.client_offers.indice
		},
		mensaje_visible() {
			return this.$store.state.client_offers.mensaje_visible
		},
		/**
		 * @returns {boolean}
		 */
		visible() {
			return this.mensaje_visible && this.articles.length > 0
		},
		/**
		 * La oferta que se esta mostrando.
		 *
		 * @returns {object|null}
		 */
		article_actual() {
			if (!this.articles.length) {
				return null
			}
			let i = this.indice
			if (i < 0 || i >= this.articles.length) {
				i = 0
			}
			return this.articles[i]
		},
		/**
		 * Firma de este comprador con estas ofertas. Es lo que se guarda al descartar.
		 *
		 * @returns {string}
		 */
		firma() {
			let buyer_id = this.user && this.user.id ? this.user.id : 0
			return firma_de_ofertas(buyer_id, this.articles)
		},
	},
	watch: {
		/*
		 * auth/me resuelve DESPUES del primer render (App.vue::callMethods lo dispara en
		 * segundo plano), asi que el caso normal es que cuando este componente se crea todavia
		 * no haya sesion. Sin este watcher la oferta no se pediria nunca.
		 */
		authenticated() {
			if (this.authenticated) {
				this.cargar()
				return
			}
			/* Se cerro sesion con el mensaje abierto: se esconde, no es de este comprador. */
			this.$store.commit('client_offers/set_mensaje_visible', false)
		},
		articles() {
			this.evaluar_apertura()
		},
		visible(nuevo) {
			if (nuevo) {
				this.bloquear_scroll()
			} else {
				this.restaurar_scroll()
			}
		},
	},
	created() {
		this.cargar()
		/*
		 * Y tambien se evalua de una: este componente no vive en las rutas de auth (App.vue lo
		 * saca junto con el navbar), asi que se destruye y se vuelve a crear al entrar y salir
		 * del login. Si las ofertas ya llegaron mientras no estaba montado, el watcher de
		 * articles no vuelve a disparar y sin esto el mensaje no se mostraria nunca.
		 */
		this.evaluar_apertura()
	},
	mounted() {
		document.addEventListener('keydown', this.al_apretar_tecla)
	},
	beforeDestroy() {
		/* Lo que se registra en mounted se saca aca, sin excepciones. */
		document.removeEventListener('keydown', this.al_apretar_tecla)
		this.restaurar_scroll()
	},
	methods: {
		/**
		 * Pide las ofertas una sola vez por sesion de SPA.
		 *
		 * @returns {void}
		 */
		cargar() {
			if (!this.authenticated || this.loaded || this.loading) {
				return
			}
			this.$store.dispatch('client_offers/getModels')
		},
		/**
		 * Decide si el mensaje se abre solo. Solo se abre cuando hay al menos una oferta y
		 * esta combinacion de comprador y ofertas no fue descartada en esta sesion.
		 *
		 * @returns {void}
		 */
		evaluar_apertura() {
			if (!this.articles.length || esta_descartado(this.firma)) {
				return
			}
			this.$store.commit('client_offers/set_indice', 0)
			this.$store.commit('client_offers/set_mensaje_visible', true)
		},
		/**
		 * @param {KeyboardEvent} evento
		 * @returns {void}
		 */
		al_apretar_tecla(evento) {
			if (!this.visible) {
				return
			}
			if (evento.key == 'Escape' || evento.keyCode == 27) {
				this.cerrar()
			}
		},
		/**
		 * Cierra el mensaje y lo deja descartado por lo que dure la sesion.
		 *
		 * @returns {void}
		 */
		cerrar() {
			marcar_descartado(this.firma)
			this.$store.commit('client_offers/set_mensaje_visible', false)
			this.$store.commit('client_offers/set_indice', 0)
		},
		/**
		 * @returns {void}
		 */
		siguiente() {
			if (this.articles.length < 2) {
				return
			}
			this.direccion_transicion = 'promo-siguiente'
			let proximo = this.indice + 1
			if (proximo >= this.articles.length) {
				proximo = 0
			}
			this.$store.commit('client_offers/set_indice', proximo)
		},
		/**
		 * @returns {void}
		 */
		anterior() {
			if (this.articles.length < 2) {
				return
			}
			this.direccion_transicion = 'promo-anterior'
			let previo = this.indice - 1
			if (previo < 0) {
				previo = this.articles.length - 1
			}
			this.$store.commit('client_offers/set_indice', previo)
		},
		/**
		 * @param {number} i
		 * @returns {void}
		 */
		ir(i) {
			if (i == this.indice) {
				return
			}
			this.direccion_transicion = i > this.indice ? 'promo-siguiente' : 'promo-anterior'
			this.$store.commit('client_offers/set_indice', i)
		},
		/**
		 * @param {TouchEvent} evento
		 * @returns {void}
		 */
		al_empezar_el_gesto(evento) {
			if (!evento.changedTouches || !evento.changedTouches.length) {
				return
			}
			this.toque_x = evento.changedTouches[0].clientX
			this.toque_y = evento.changedTouches[0].clientY
		},
		/**
		 * Swipe horizontal en telefono, sin ninguna libreria.
		 *
		 * Los dos umbrales van juntos: 45px horizontales para que un toque tembleque no cambie
		 * de oferta, y menos de 40px verticales para no robarle el scroll al panel.
		 *
		 * @param {TouchEvent} evento
		 * @returns {void}
		 */
		al_terminar_el_gesto(evento) {
			if (this.toque_x === null || !evento.changedTouches || !evento.changedTouches.length) {
				return
			}
			let dx = evento.changedTouches[0].clientX - this.toque_x
			let dy = evento.changedTouches[0].clientY - this.toque_y
			this.toque_x = null
			this.toque_y = null
			if (this.articles.length < 2 || Math.abs(dy) >= 40 || Math.abs(dx) < 45) {
				return
			}
			if (dx < 0) {
				this.siguiente()
			} else {
				this.anterior()
			}
		},
		/**
		 * "Usar la promocion": deja la ficha lista para agregar al carrito.
		 *
		 * @param {object} article
		 * @returns {void}
		 */
		usar_la_promocion(article) {
			/* El objeto ya viene completo de la API, con la misma forma que cualquier listado. */
			this.$store.commit('articles/setArticleToShow', article)

			this.$store.commit('client_offers/set_cantidad_pendiente', this.cantidad_a_precargar(article))

			marcar_descartado(this.firma)
			this.$store.commit('client_offers/set_mensaje_visible', false)
			this.$store.commit('client_offers/set_indice', 0)

			/*
			 * vue-router 3.2 devuelve una promesa que RECHAZA cuando la navegacion es a la
			 * misma ruta (NavigationDuplicated), y eso pasa de verdad: el boton del navbar
			 * reabre el mensaje estando ya parado en la ficha de esa oferta.
			 */
			let navegacion = this.$router.push({
				name: 'Article',
				params: {
					slug: article.slug,
					commerce_id: process.env.VUE_APP_COMMERCE_ID,
				},
			})
			if (navegacion && typeof navegacion.catch == 'function') {
				navegacion.catch(() => {})
			}
		},
		/**
		 * Cuantas unidades dejar precargadas en la ficha.
		 *
		 * Solo tiene sentido en las ofertas por cantidad: se precarga el `min` del mejor tramo
		 * (el ultimo, que es el de mayor porcentaje). En las de tipo 'unidad' devuelve null y
		 * la ficha usa su default_amount_add_to_cart de siempre.
		 *
		 * ⚠️ Recortado al stock: el techo del tramo lo puso el ERP al crear la oferta y el
		 * stock pudo bajar despues. Amount.vue::check_amount recorta al maximo y dispara un
		 * toast de error, asi que precargar de mas le tira un error en la cara al comprador
		 * apenas llega a la ficha.
		 *
		 * @param {object} article
		 * @returns {number|null}
		 */
		cantidad_a_precargar(article) {
			let oferta = this.oferta_personalizada(article)
			if (!oferta || oferta.tipo_descuento != 'cantidad' || !oferta.rangos || !oferta.rangos.length) {
				return null
			}
			let mejor_tramo = oferta.rangos[oferta.rangos.length - 1]
			if (!mejor_tramo || !mejor_tramo.min) {
				return null
			}
			let cantidad = Number(mejor_tramo.min)
			let stock = Number(article.stock)
			if (article.stock !== null && typeof article.stock != 'undefined' && !isNaN(stock) && stock < cantidad) {
				cantidad = stock
			}
			if (cantidad < 1) {
				return null
			}
			return cantidad
		},
		/**
		 * Guarda el overflow del body ANTES de pisarlo. No se restaura a '' porque ese no es
		 * necesariamente el valor de antes.
		 *
		 * @returns {void}
		 */
		bloquear_scroll() {
			if (this.overflow_previo === null) {
				this.overflow_previo = document.body.style.overflow
			}
			document.body.style.overflow = 'hidden'
		},
		/**
		 * @returns {void}
		 */
		restaurar_scroll() {
			if (this.overflow_previo === null) {
				return
			}
			document.body.style.overflow = this.overflow_previo
			this.overflow_previo = null
		},
	},
}
</script>
<style lang="sass">
.promo
	// Una sola curva para todo el componente: la de las transiciones de iOS/macOS, arranque
	// rapido y frenada larga. Nada de ease-in-out generico, nada de rebote, nada de spring.
	--curva-promo: cubic-bezier(0.32, 0.72, 0, 1)

	position: fixed
	top: 0
	right: 0
	bottom: 0
	left: 0
	// Por encima de .cont-nav (100), de #buyer-messages (1000) y del modal de Bootstrap (1050).
	z-index: 1200
	// 🔴 El scroll vive ACA y no en el panel. En escritorio las flechas se salen del panel a
	// los costados, y cualquier overflow distinto de visible en el panel las recortaria
	// (o peor: las mandaria a una barra de scroll horizontal).
	overflow-y: auto
	-webkit-overflow-scrolling: touch
	display: flex

	.promo__velo
		position: fixed
		top: 0
		right: 0
		bottom: 0
		left: 0
		background: rgba(0, 0, 0, .32)

	// Telefono: hoja completa, sin bordes redondeados.
	.promo__panel
		position: relative
		z-index: 1
		// `margin: auto` centra en los dos ejes sin el problema de `align-items: center`, que
		// cuando el contenido no entra deja el borde de arriba fuera de alcance del scroll.
		margin: auto
		width: 100%
		min-height: 100%
		padding: 1.5rem 1.25rem
		text-align: left
		background: rgba(255, 255, 255, .72)
		backdrop-filter: blur(20px) saturate(180%)
		-webkit-backdrop-filter: blur(20px) saturate(180%)
		box-shadow: 0 30px 60px rgba(0, 0, 0, .18)

		// Sin backdrop-filter el fondo translucido deja el texto ilegible: se sube a casi opaco.
		@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))
			background: rgba(255, 255, 255, .96)

	// La x: discreta hasta que la buscas.
	.promo__cerrar
		position: absolute
		top: .75rem
		right: .75rem
		z-index: 2
		width: 44px
		height: 44px
		display: flex
		align-items: center
		justify-content: center
		padding: 0
		border: none
		border-radius: 999px
		background: none
		color: #1d1d1f
		font-size: 1rem
		opacity: .4
		cursor: pointer
		-webkit-appearance: none
		appearance: none
		transition: opacity 220ms var(--curva-promo)

		&:hover
			opacity: .9

		&:focus
			outline: none

		&:focus-visible
			outline: 2px solid var(--secondary-color)
			outline-offset: 2px
			opacity: .9

// Tablet (768-1024) y el hueco hasta escritorio: panel centrado de 620px.
@media screen and (min-width: 768px)
	.promo
		padding: 2rem

		.promo__panel
			min-height: 0
			max-width: 620px
			padding: 2rem
			border-radius: 22px

// Escritorio (>= 1366): panel de 880px, con lugar a los costados para las flechas.
@media screen and (min-width: 1366px)
	.promo
		padding: 3rem

		.promo__panel
			max-width: 880px
			padding: 2.5rem 3rem

// ── Entrada: tres capas escalonadas con transition-delay ──────────────────────────────
// Se anima SOLO opacity y transform, que son las dos propiedades que compositan en GPU.
.promo-enter-active
	.promo__velo
		transition: opacity 320ms var(--curva-promo)

	.promo__panel
		transition: opacity 520ms var(--curva-promo) 80ms, transform 520ms var(--curva-promo) 80ms

	.promo__capa-1
		transition: opacity 420ms var(--curva-promo) 180ms, transform 420ms var(--curva-promo) 180ms

	.promo__capa-2
		transition: opacity 420ms var(--curva-promo) 240ms, transform 420ms var(--curva-promo) 240ms

	.promo__capa-3
		transition: opacity 420ms var(--curva-promo) 300ms, transform 420ms var(--curva-promo) 300ms

.promo-enter
	.promo__velo
		opacity: 0

	.promo__panel
		opacity: 0
		transform: translateY(12px) scale(0.98)

	.promo__capa-1, .promo__capa-2, .promo__capa-3
		opacity: 0
		transform: translateY(8px)

// ── Salida: entrar despacio, salir rapido. Sin escalonar. ─────────────────────────────
.promo-leave-active
	transition: opacity 220ms var(--curva-promo)

	.promo__panel
		transition: transform 220ms var(--curva-promo)

.promo-leave-to
	opacity: 0

	.promo__panel
		transform: scale(0.985)

// ── Cambio de una oferta a otra: el movimiento acompaña el gesto. ─────────────────────
.promo-siguiente-enter-active, .promo-siguiente-leave-active, .promo-anterior-enter-active, .promo-anterior-leave-active
	transition: opacity 280ms var(--curva-promo), transform 280ms var(--curva-promo)

.promo-siguiente-enter, .promo-anterior-leave-to
	opacity: 0
	transform: translateX(24px)

.promo-siguiente-leave-to, .promo-anterior-enter
	opacity: 0
	transform: translateX(-24px)

// ── Con "reducir movimiento" prendido: lo mismo, pero sin desplazamiento. ─────────────
// Va sobre los elementos que anima la transicion y no sobre `.promo *`: un `transform: none`
// generalizado tambien mataria el translateY(-50%) con el que se centran las flechas de
// escritorio y el scale del punto activo, que son posicionamiento y no animacion.
@media (prefers-reduced-motion: reduce)
	.promo__velo, .promo__panel, .promo__capa-1, .promo__capa-2, .promo__capa-3, .promo-tarjeta
		transition-duration: 1ms !important
		transition-delay: 0ms !important
		transform: none !important

	.promo__cerrar, .promo-tarjeta__boton, .promo-nav__flecha, .promo-nav__punto-marca
		transition-duration: 1ms !important
		transition-delay: 0ms !important
</style>
