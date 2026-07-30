<template>
	<auth-layout
	title="Bienvenido de vuelta"
	:subtitle="'Ingresa a tu cuenta de ' + commerce_name">
		<form-login></form-login>
	</auth-layout>
</template>
<script>
import AuthLayout from '@/components/auth/AuthLayout'
import FormLogin from '@/components/login/components/Form'
export default {
	name: 'Login',
	created() {
		this.$scrollToTop()
	},
	components: {
		AuthLayout,
		FormLogin,
	},
	computed: {
		/**
		 * Nombre visible del comercio para armar la bajada del login
		 * ("Ingresa a tu cuenta de {nombre}"). Espeja el mismo fallback que usa
		 * AuthLayout (company_name -> name -> 'Tienda'); se mantiene chico y local
		 * aca porque esta vista solo lo necesita para un texto, no amerita un mixin
		 * compartido todavia.
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
	},
}
</script>
