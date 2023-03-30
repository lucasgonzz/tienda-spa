<template>
	<b-card 
	class="m-t-15 c-p shadow"
	@click="toLogin()"
	v-if="!can_see_prices" 
	dismissible 
	variant="success">
		<div class="text-with-icon">
			<i class="icon-user-black-add"></i>
			Inicia sesion para poder ver nuestros precios
		</div>
	</b-card>
</template>
<script>
export default {
	methods: {
		toLogin() {
			this.$router.push({name: 'Login'})
		}
	},
}
</script>