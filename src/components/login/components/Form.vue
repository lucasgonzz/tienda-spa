<template>
	<div>
		<b-form-group>
			<b-form-input
			@keydown.enter="login(user_login)"
			v-model="user_login.email"
			placeholder="Email"></b-form-input>
		</b-form-group>
		<b-form-group>
			<b-form-input
			v-model="user_login.password"
			type="password"
			@keydown.enter="login(user_login)"
			placeholder="Contraseña"></b-form-input>
		</b-form-group>
		<b-form-group
		class="form-remeber">
			<b-form-checkbox
			v-model="user_login.remember">
				Recordarme
			</b-form-checkbox>
		</b-form-group>
		<b-button
		:disabled="disabled"
		@click="login(user_login)"
		block
		class="m-b-20"
		variant="primary">
			<btn-loader
			text="Ingresar"
			:loader="loading">
			</btn-loader>
		</b-button>
		<b-button
		block
		:to="{name: 'PasswordReset'}"
		class="m-b-10 text-success w-100">
			Olvide mi contraseña
		</b-button>
	</div>
</template>
<script>
import BtnLoader from '@/components/common/BtnLoader'
import auth from '@/mixins/auth'
import nav from '@/mixins/nav'
export default {
	mixins: [auth, nav],
	components: {
		BtnLoader
	},
	computed: {
		loading() {
			return this.$store.state.auth.loading_login
		},
		disabled() {
			return this.user_login.email == '' && this.user_login.password == ''
		}
	},
	data() {
		return {
			user_login: {
				email: '',
				password: '',
				remember: false
			},
		}
	},
	methods: {
		AuthProvider(provider) {
			var self = this
			this.$auth.authenticate(provider).then(response =>{
				self.SocialLogin(provider,response)
			})
			.catch(err => {
				console.log('error 1')
				console.log({err:err})
			})
		},
		SocialLogin(provider,response){
			this.$axios.post('/sociallogin/'+provider,response).then(response => {
				console.log(response.data)
			}).catch(err => {
				console.log({err:err})
			})
		},
	}
}
</script>
<style lang="sass">
.form-login
	.text-muted
		text-align: left
	.text-register
		color: rgba(0,0,0,.7)
		button 
			display: inline
	.custom-checkbox
		display: flex
		justify-content: flex-end
</style>