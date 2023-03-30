<template>
	<b-button
	v-if="commerce.configuration.show_google_login"
	class="m-b-20 btn-google"
	block
	@click="authProvider('google')">
		<img 
		src="@/assets/google-icon.png">
		Continuar con Google
	</b-button>
</template>
<script>
import auth from '@/mixins/auth'
export default {
	mixins: [auth],
	methods: {
		authProvider(provider) {
			let self = this
			this.$auth.authenticate(provider).then(response => {
				self.socialLogin(provider, response)
			}).catch(err => {
				console.log({err:err})
			})
		},
		socialLogin(provider, response) {
			console.log('response de google:')
			console.log(response)
        	this.$store.commit('auth/setLoading', true)
			this.$axios.post(`/sociallogin/${provider}/${process.env.VUE_APP_COMMERCE_ID}`, response)
			.then(res => {
				console.log('response despues de registrar el usuario')
				console.log(res)
				this.$store.dispatch('auth/me')
				.then(() => {
        			this.$store.commit('auth/setLoading', false)
        			this.checkCart()
        			this.redirectAfterLogin()
				})
			}).catch(err => {
				console.log({err:err})
			})
		}
	}
}
</script>
<style lang="sass">
.btn-google
	background: #FFF !important
	color: #333 !important
	border-color: #4285F4
	position: relative
	img 
		position: absolute
		top: 50%
		transform: translateY(-50%)
		left: 12%
		width: 30px !important
		margin: 0 !important
</style>