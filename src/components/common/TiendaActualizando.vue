<template>
	<div
	class="tienda-actualizando"
	role="status"
	aria-live="polite">
		<div
		class="tienda-actualizando__contenido">
			<!-- Indicador discreto: un aro que gira despacio. No hay logo ni nombre del comercio porque
			el comercio todavía no cargó (es justo lo que falló). -->
			<span
			class="tienda-actualizando__aro"
			aria-hidden="true"></span>

			<h1
			class="tienda-actualizando__titulo">
				Estamos actualizando la tienda
			</h1>
			<p
			class="tienda-actualizando__texto">
				Volvé a intentar en unos minutos. Esta pantalla se actualiza sola cuando terminemos.
			</p>
		</div>
	</div>
</template>
<script>
import { iniciar_reintento } from '@/utils/tienda_actualizando'
export default {
	data() {
		return {
			/* Función que corta el reintento; se arma en created y se llama al destruir el componente. */
			detener_reintento: null,
		}
	},
	computed: {
		/**
		 * true mientras tienda-api siga respondiendo la marca de "sistema actualizando".
		 *
		 * @returns {boolean}
		 */
		actualizando() {
			return this.$store.state.commerce.actualizando
		},
	},
	created() {
		this.empezar_reintento()
	},
	beforeDestroy() {
		if (this.detener_reintento) {
			this.detener_reintento()
			this.detener_reintento = null
		}
	},
	methods: {
		/**
		 * Vuelve a pedir el comercio cada 30 s. getCommerce apaga `actualizando` cuando el comercio
		 * llega bien; en ese momento se recarga la página para arrancar de cero con el sistema ya
		 * actualizado (la tienda pudo cambiar de versión mientras esperaba).
		 *
		 * Sin loading global a propósito: es un chequeo silencioso de fondo y el overlay de carga
		 * taparía esta pantalla cada 30 s.
		 *
		 * @returns {void}
		 */
		empezar_reintento() {
			let self = this
			this.detener_reintento = iniciar_reintento(
				function () {
					return self.$store.dispatch('commerce/getCommerce')
					.then(() => !self.actualizando)
				},
				function () {
					window.location.reload()
				}
			)
		},
	},
}
</script>
<style scoped lang="sass">
@import '@/sass/_custom'

// Pantalla completa sobria: fondo liso y un solo bloque centrado. Sin rojo: es un estado normal, no una falla.
.tienda-actualizando
	position: fixed
	top: 0
	left: 0
	width: 100vw
	height: 100vh
	// Por encima del overlay de carga (LogoLoading, 10000) y de cualquier modal de la tienda.
	z-index: 10001
	display: flex
	align-items: center
	justify-content: center
	padding: 24px
	text-align: center
	background: #FFF
	color: #1d1d1f
	@if ($theme == dark)
		background: #000
		color: #f5f5f7

.tienda-actualizando__contenido
	max-width: 420px

// Aro fino que gira lento: único movimiento de la pantalla.
.tienda-actualizando__aro
	display: block
	width: 28px
	height: 28px
	margin: 0 auto 28px
	border-radius: 50%
	border: 2px solid rgba(128, 128, 128, 0.25)
	border-top-color: rgba(128, 128, 128, 0.85)
	animation: tienda-actualizando-giro 1.6s linear infinite

.tienda-actualizando__titulo
	margin: 0 0 12px
	font-size: 1.75rem
	font-weight: 600
	letter-spacing: -0.01em
	line-height: 1.2

.tienda-actualizando__texto
	margin: 0
	font-size: 1rem
	line-height: 1.5
	opacity: 0.65

// Quien pidió menos movimiento en su sistema ve el aro quieto.
@media (prefers-reduced-motion: reduce)
	.tienda-actualizando__aro
		animation: none

// Teléfonos (360-390 px): título un poco más chico para que no parta en tres líneas.
@media (max-width: 480px)
	.tienda-actualizando__titulo
		font-size: 1.4rem

@keyframes tienda-actualizando-giro
	to
		transform: rotate(360deg)
</style>
