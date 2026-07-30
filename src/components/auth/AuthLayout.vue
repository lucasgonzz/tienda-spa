<template>
	<!-- Layout compartido para las vistas de autenticacion (login, registro, recuperar clave). -->
	<!-- Escritorio: panel de marca del comercio a la izquierda + formulario a la derecha (split screen). -->
	<!-- Mobile (<900px): cabecera con la marca arriba, formulario abajo, todo centrado. -->
	<div class="auth-layout">

		<!-- Cabecera mobile: marca del comercio centrada, visible solo en pantallas chicas -->
		<div class="auth-layout__mobile-header">
			<span class="auth-layout__deco auth-layout__deco--mobile-1" aria-hidden="true"></span>
			<span class="auth-layout__deco auth-layout__deco--mobile-2" aria-hidden="true"></span>
			<div class="auth-layout__mobile-brand">
				<div class="auth-layout__logo-wrap">
					<img
					v-if="logo_url"
					@click="home"
					class="auth-layout__logo apretable c-p"
					:src="logo_url"
					:alt="commerce_name">
					<span
					v-else
					@click="home"
					class="auth-layout__logo-initial apretable c-p">{{ initial }}</span>
				</div>
				<h1 class="auth-layout__mobile-title">{{ commerce_name }}</h1>
				<p
				v-if="subtitle"
				class="auth-layout__mobile-subtitle">{{ subtitle }}</p>
			</div>
		</div>

		<!-- Panel izquierdo: marca chica arriba, titulo/bajada al medio, nota de seguridad abajo. Solo escritorio -->
		<div class="auth-layout__left">

			<span class="auth-layout__deco auth-layout__deco--1" aria-hidden="true"></span>
			<span class="auth-layout__deco auth-layout__deco--2" aria-hidden="true"></span>
			<span class="auth-layout__deco auth-layout__deco--3" aria-hidden="true"></span>

			<header class="auth-layout__brand">
				<img
				v-if="logo_url"
				@click="home"
				class="auth-layout__brand-logo apretable c-p"
				:src="logo_url"
				:alt="commerce_name">
				<span
				v-else
				@click="home"
				class="auth-layout__brand-logo-initial apretable c-p">{{ initial }}</span>
				<span class="auth-layout__brand-name">{{ commerce_name }}</span>
			</header>

			<div class="auth-layout__hero">
				<h2 class="auth-layout__title">{{ title }}</h2>
				<p
				v-if="subtitle"
				class="auth-layout__subtitle">{{ subtitle }}</p>
			</div>

			<div class="auth-layout__security">
				<span class="auth-layout__security-icon" aria-hidden="true">
					<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
					</svg>
				</span>
				<p class="auth-layout__security-note">Conexion segura &middot; Tus datos estan protegidos</p>
			</div>

		</div>

		<!-- Panel derecho: fondo blanco con el formulario (slot por defecto) -->
		<div class="auth-layout__right">
			<div class="auth-layout__form-wrap">
				<slot></slot>
			</div>
		</div>

	</div>
</template>
<script>
// Solo hace falta el mixin "nav": expone home(), y "commerce" ya esta disponible
// globalmente porque el mixin "generals" se registra con Vue.mixin en main.js.
// Importar los dos aca seria redundante.
import nav from '@/mixins/nav'

/**
 * Layout reutilizable para las vistas de autenticacion de la tienda (login, registro,
 * recuperar clave). Reemplaza el asset estatico "@/assets/icon.png" (que quedo
 * hardcodeado con el logo de un cliente) por el logo real del comercio, tomado en
 * runtime desde online_configuration.logo_url o commerce.image_url -- el mismo
 * criterio que ya usa el navbar (ver components/nav/BrandBtn.vue).
 *
 * Estructura: panel de marca a la izquierda (split screen) en escritorio >900px,
 * cabecera de marca arriba y formulario abajo en mobile.
 */
export default {
	name: 'AuthLayout',
	mixins: [nav],
	props: {
		// Titulo grande del panel de marca (ej. "Bienvenido de vuelta")
		title: {
			type: String,
			required: true,
		},
		// Bajada corta debajo del titulo, opcional
		subtitle: {
			type: String,
			default: '',
		},
	},
	computed: {
		/**
		 * URL del logo del comercio a mostrar en el layout de auth.
		 * Prioridad: logo configurado en la tienda online (online_configuration.logo_url);
		 * si no esta cargado, cae al logo general del comercio (commerce.image_url);
		 * si tampoco existe, devuelve null para que el template muestre el circulo
		 * con la inicial en su lugar (nunca una imagen rota).
		 *
		 * Escrito en forma defensiva (sin optional chaining "?.") porque
		 * online_configuration puede no venir todavia en el primer render.
		 *
		 * @returns {string|null}
		 */
		logo_url() {
			if (this.commerce && this.commerce.online_configuration && this.commerce.online_configuration.logo_url) {
				return this.commerce.online_configuration.logo_url
			}
			if (this.commerce && this.commerce.image_url) {
				return this.commerce.image_url
			}
			return null
		},
		/**
		 * Nombre visible del comercio, con fallbacks defensivos por si "commerce"
		 * todavia no cargo completo (company_name o name faltantes).
		 *
		 * @returns {string}
		 */
		commerce_name() {
			if (this.commerce && this.commerce.company_name) {
				return this.commerce.company_name
			}
			if (this.commerce && this.commerce.name) {
				return this.commerce.name
			}
			return 'Tienda'
		},
		/**
		 * Primer caracter alfanumerico del nombre del comercio, en mayuscula.
		 * Se usa dentro del circulo de fallback cuando el comercio no tiene logo cargado,
		 * con el mismo criterio que usa el generador de iconos PWA del admin.
		 *
		 * @returns {string}
		 */
		initial() {
			// Busca el primer caracter alfanumerico para evitar iniciales raras
			// si el nombre arranca con un simbolo o espacio.
			let first_alphanumeric = this.commerce_name.match(/[a-zA-Z0-9]/)
			return first_alphanumeric ? first_alphanumeric[0].toUpperCase() : '?'
		},
	},
}
</script>
<style lang="sass" scoped>
@import '@/sass/_custom'

// Ancho de quiebre mobile/desktop del layout de auth (mismo valor que empresa-spa)
$auth_layout_mobile_breakpoint: 900px

.auth-layout
	display: flex
	min-height: 100vh
	font-family: var(--font-family-sans)
	// Los paneles de auth (izquierdo y derecho) son siempre casi blancos, sin importar el color
	// primario del comercio (7% de mezcla con blanco, o blanco puro). Por eso el texto NO puede
	// depender de las variables de tema (--text-color esta pensado para superficies coloreadas,
	// como el navbar), sino de un color fijo con buen contraste sobre fondo claro/casi blanco.
	// Se declaran aca en la raiz para que las herede todo el subarbol, incluido el slot
	// (formularios de login/registro/recuperar clave), sin tener que importar sass en cada uno.
	--auth-text-strong: #1f2937
	--auth-text-muted: #4b5563
	@if ($theme == dark)
		--auth-text-strong: #f2f2f2
		--auth-text-muted: #b8bcc4
	// Contrarresta "#app { text-align: center }" (heredado del boilerplate de Vue CLI en App.vue,
	// no tocar esa regla porque la usa toda la tienda). Sin esto, todo el texto de auth queda
	// centrado por herencia. Lo que si va centrado (cabecera mobile) se re-centra mas abajo.
	text-align: left
	@media screen and (max-width: $auth_layout_mobile_breakpoint)
		flex-direction: column

// Circulos decorativos: son un detalle discreto, no el protagonista de la pantalla
.auth-layout__deco
	position: absolute
	border-radius: 50%
	border: 1px solid color-mix(in srgb, var(--primary-color) 18%, transparent)
	background: transparent
	pointer-events: none

// ─── Cabecera mobile ───
.auth-layout__mobile-header
	display: none
	position: relative
	@media screen and (max-width: $auth_layout_mobile_breakpoint)
		display: flex
		align-items: center
		justify-content: center
		min-height: 34vh
		padding: 2.5rem 1.75rem 2.75rem
		background: color-mix(in srgb, var(--primary-color) 7%, #ffffff)
		overflow: hidden
		box-sizing: border-box
		@if ($theme == dark)
			background: color-mix(in srgb, var(--primary-color) 14%, #1a1a1a)

.auth-layout__mobile-brand
	position: relative
	z-index: 1
	text-align: center
	width: 100%
	max-width: 320px

.auth-layout__logo-wrap
	width: 76px
	height: 76px
	border-radius: 50%
	background: #ffffff
	display: flex
	align-items: center
	justify-content: center
	margin: 0 auto 1.15rem
	box-shadow: 0 4px 16px rgba(17, 24, 39, 0.08)
	overflow: hidden

.auth-layout__logo
	width: 52px
	height: 52px
	border-radius: 50%
	object-fit: cover

.auth-layout__logo-initial
	width: 52px
	height: 52px
	border-radius: 50%
	display: flex
	align-items: center
	justify-content: center
	background: var(--primary-color)
	color: #ffffff
	font-weight: 700
	font-size: 1.35rem

.auth-layout__mobile-title
	font-size: 1.375rem
	font-weight: 700
	color: var(--auth-text-strong)
	margin: 0 0 0.45rem
	letter-spacing: -0.02em

.auth-layout__mobile-subtitle
	font-size: 0.875rem
	font-weight: 400
	color: var(--auth-text-muted)
	line-height: 1.5
	margin: 0

.auth-layout__deco--mobile-1
	width: 280px
	height: 280px
	left: -90px
	top: -60px

.auth-layout__deco--mobile-2
	width: 340px
	height: 340px
	right: -110px
	bottom: -120px

// ─── Panel izquierdo desktop ───
.auth-layout__left
	position: relative
	flex: 0 0 50%
	max-width: 50%
	background: color-mix(in srgb, var(--primary-color) 7%, #ffffff)
	display: flex
	flex-direction: column
	justify-content: space-between
	padding: 2.75rem 3.5rem 2.25rem
	box-sizing: border-box
	overflow: hidden
	@media screen and (max-width: $auth_layout_mobile_breakpoint)
		display: none
	@if ($theme == dark)
		background: color-mix(in srgb, var(--primary-color) 14%, #1a1a1a)

.auth-layout__deco--1
	width: 380px
	height: 380px
	right: -80px
	top: 12%

.auth-layout__deco--2
	width: 520px
	height: 520px
	right: -160px
	bottom: -140px

.auth-layout__deco--3
	width: 220px
	height: 220px
	right: 28%
	top: 38%

.auth-layout__brand
	display: flex
	align-items: center
	gap: 0.6rem
	position: relative
	z-index: 1

.auth-layout__brand-logo
	width: 32px
	height: 32px
	border-radius: 8px
	object-fit: cover
	flex-shrink: 0

.auth-layout__brand-logo-initial
	width: 32px
	height: 32px
	border-radius: 8px
	display: flex
	align-items: center
	justify-content: center
	background: var(--primary-color)
	color: #ffffff
	font-weight: 700
	font-size: 0.9rem
	flex-shrink: 0

.auth-layout__brand-name
	font-size: 1.0625rem
	font-weight: 600
	color: var(--auth-text-strong)
	letter-spacing: -0.02em

.auth-layout__hero
	flex: 1
	display: flex
	flex-direction: column
	justify-content: center
	position: relative
	z-index: 1
	padding: 1.5rem 0 2rem
	max-width: 520px

.auth-layout__title
	font-size: 2.5rem
	font-weight: 800
	line-height: 1.15
	color: var(--auth-text-strong)
	margin: 0 0 1.1rem
	letter-spacing: -0.03em

.auth-layout__subtitle
	font-size: 1.0625rem
	font-weight: 400
	color: var(--auth-text-muted)
	line-height: 1.6
	margin: 0
	max-width: 460px

// ─── Nota de seguridad ───
.auth-layout__security
	display: flex
	align-items: center
	gap: 0.5rem
	position: relative
	z-index: 1

.auth-layout__security-icon
	display: flex
	align-items: center
	justify-content: center
	width: 28px
	height: 28px
	border-radius: 50%
	background: var(--primary-color)
	color: #ffffff
	flex-shrink: 0
	svg
		width: 14px
		height: 14px

.auth-layout__security-note
	font-size: 0.8125rem
	font-weight: 400
	color: var(--auth-text-muted)
	margin: 0

// ─── Panel del formulario (blanco) ───
.auth-layout__right
	flex: 0 0 50%
	max-width: 50%
	background: #ffffff
	display: flex
	align-items: center
	justify-content: center
	padding: 2rem 3rem
	box-sizing: border-box
	@media screen and (max-width: $auth_layout_mobile_breakpoint)
		flex: 1
		max-width: 100%
		align-items: flex-start
		justify-content: center
		padding: 2rem 1.75rem 2.5rem
	@if ($theme == dark)
		background: #1a1a1a

.auth-layout__form-wrap
	width: 100%
	max-width: 380px
</style>
