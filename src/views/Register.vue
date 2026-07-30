<template>
	<!-- Reusa el layout compartido de autenticacion (creado en el prompt 01 de este grupo)
	en vez de duplicar el markup viejo de b-row/b-col con el logo hardcodeado. -->
	<auth-layout
	title="Crea tu cuenta"
	:subtitle="'Compra mas rapido en ' + commerce_name">
		<form-register></form-register>
		<verify-code></verify-code>
	</auth-layout>
</template>
<script>
import AuthLayout from '@/components/auth/AuthLayout'
import FormRegister from '@/components/register/components/Form'
import VerifyCode from '@/components/register/components/VerifyCode'
export default {
	name: 'Register',
	// Ya no necesita el mixin "nav": el click sobre el logo (home()) ahora vive
	// dentro de AuthLayout, que lo resuelve por su cuenta.
	components: {
		AuthLayout,
		FormRegister,
		VerifyCode,
	},
	computed: {
		/**
		 * Nombre visible del comercio para armar la bajada del registro
		 * ("Compra mas rapido en {nombre}"). Replica el mismo fallback que usa
		 * AuthLayout (company_name -> name -> 'Tienda') sin duplicar su logica del
		 * logo, tal como pide el prompt.
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