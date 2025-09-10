<template>
	<b-row
	class="auth login">
		<b-col
		class="d-none d-lg-flex col-img"
		lg="6">
			<img 
			@click="home"
			class="apretable c-p"
			src="@/assets/icon.png" 
			:alt="commerce.company_name">
		</b-col>
		<b-col 
		class="col-form"
		cols="12"
		sm="9"
		md="6"
		lg="6"
		xl="4">
			<img 
			@click="home"
			class="apretable c-p d-lg-none"
			src="@/assets/icon.png" 
			:alt="commerce.company_name">
			<b-card
			class="form-login s">
				<h4>
					<strong>
						Bienvenido
					</strong>
				</h4>
				<hr>
				<h6><strong>Ingresa con tu cuenta</strong></h6>
				<form-login></form-login>

				<hr>
				<h6>
					¿Aun  no tenes cuenta?
				</h6>
				<b-button
				class="m-b-20"
				block
				@click="toRegister()"
				variant="success">
					Registrarse
				</b-button>
			</b-card>
		</b-col>
	</b-row>
</template>P
<script>
import nav from '@/mixins/nav'
import FormLogin from '@/components/login/components/Form'
import SocialLogin from '@/components/login/components/SocialLogin'
export default {
	name: 'Login',
	mixins: [nav],
	created() {
		this.$scrollToTop()
	},	
	components: {
		FormLogin,
		SocialLogin,
	},
}
</script>