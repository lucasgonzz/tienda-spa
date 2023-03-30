<template>
	<b-modal id="login-required" hide-footer hide-header size="sm">
		<h6
		class="text-center">Necesitas ingresar para poder continuar</h6>
		<b-button
		block
		:to="{name: 'Login'}"
		variant="success">
			Ingresar
		</b-button>
	</b-modal>
</template>
<style scoped lang="sass">
</style>