<template>
	<!-- Reusa el layout compartido de autenticacion (creado en el prompt 01 de este grupo)
	en vez de duplicar el markup viejo de b-row/b-col con el logo hardcodeado. -->
	<auth-layout
	title="Recuperar tu clave"
	subtitle="Te enviamos un codigo para volver a entrar">
		<form-password-reset></form-password-reset>
	</auth-layout>
</template>
<script>
import AuthLayout from '@/components/auth/AuthLayout'
import FormPasswordReset from '@/components/password-reset/components/Form'
export default {
	// Corregido: quedaba "Register" por un copy/paste viejo (se verifico que
	// ningun lugar del repo referencia este componente por ese nombre interno).
	name: 'PasswordReset',
	// Ya no necesita el mixin "nav": el click sobre el logo (home()) ahora vive
	// dentro de AuthLayout, que lo resuelve por su cuenta.
	components: {
		AuthLayout,
		FormPasswordReset,
	},
}
</script>