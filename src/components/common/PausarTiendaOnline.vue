<template>
	<div
	class="container-logo">
		<img
		v-if="logo_url"
		:src="logo_url" alt="">
		<!-- Fallback cuando el comercio no tiene logo cargado: mismo circulo con la
		inicial que usa AuthLayout, en vez de dejar un <img> roto. -->
		<span
		v-else
		class="container-logo__initial">{{ initial }}</span>

        <p>
        	Nuestro sitio web se encuentra momentáneamente fuera de servicio
        </p>
        <p>
        	Estamos trabajando para brindarte un mejor servicio
        </p>
        <p>
        	Disculpe las molestias
        </p>
	</div>
</template>
<script>
export default {
	computed: {
		/**
		 * URL del logo del comercio para la pantalla de tienda pausada.
		 * Mismo criterio en runtime que usa el navbar (BrandBtn.vue) y AuthLayout:
		 * prioriza online_configuration.logo_url, despues commerce.image_url. Antes
		 * mostraba un logo hardcodeado (el asset estatico del icono viejo) que no
		 * era el del comercio real.
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
		 * Nombre visible del comercio, con los mismos fallbacks defensivos que usa
		 * AuthLayout, para poder calcular la inicial cuando no hay logo cargado.
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
		 * Mismo criterio que AuthLayout para el circulo de fallback sin logo.
		 *
		 * @returns {string}
		 */
		initial() {
			let first_alphanumeric = this.commerce_name.match(/[a-zA-Z0-9]/)
			return first_alphanumeric ? first_alphanumeric[0].toUpperCase() : '?'
		},
	},
}
</script>
<style scoped lang="sass">
@import '@/sass/_custom'
.container-logo
	@if ($theme == dark) 
		background: rgba(0, 0, 0, 9)
	@else if ($theme == ligth) 
		background: #FFF
	position: fixed
	width: 100vw
	height: 100vh
	z-index: 1000
	display: flex
	flex-direction: column
	justify-content: center
	align-items: center
	img 
		width: 90px
		margin-bottom: 8px
	.container-logo__initial
		width: 90px
		height: 90px
		border-radius: 50%
		display: flex
		align-items: center
		justify-content: center
		margin-bottom: 8px
		background: var(--primary-color)
		color: #ffffff
		font-weight: 700
		font-size: 2rem
	.spinner-border 
		width: 25px
		height: 25px
	.progress 
		width: 200px
	p 
		margin-top: 10px
		font-weight: bold
</style>