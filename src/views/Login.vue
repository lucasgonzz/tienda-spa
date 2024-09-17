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
				<h6>Elegi como queres continuar</h6>
				<!-- <social-login></social-login> -->
				<hr>
				<h6>
					<strong>
						¿Aun  no tenes cuenta?
					</strong>
				</h6>
				<b-button
				class="m-b-20"
				block
				@click="toRegister()"
				variant="success">
					Registrarse
				</b-button>
				<hr>
				<h6>O ingresa con tu cuenta</h6>
				<form-login></form-login>
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