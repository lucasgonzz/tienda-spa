<template>
	<b-card
	class="form-register"
	title="Recuperar contraseña">
		<div
		v-if="!verification_code_send">
			<b-form-group
			label="Ingresa tu correo para que te enviemos un código de recuperación.">
				<b-form-input
				v-model="register_user.email"
				@keyup.enter="sendCode"
				placeholder="Correo electronico"></b-form-input>
			</b-form-group>
			<b-form-group>
				<b-button
				@click="sendCode"
				block
				variant="success">
					<btn-loader
					text="Enviar codigo"
					:loader="loading"></btn-loader>
				</b-button>
			</b-form-group>
		</div>
		<div
		v-if="verification_code_send && !code_verified">
			<p class="text-left">
				Enviamos un código de verificación a {{ register_user.email }}, si no encuentras el correo revisa la lista de SPAM.
			</p>
			<b-form-group>
				<b-form-input
				v-model="register_user.verification_code"
				type="number"
				@keyup.enter="checkVerificationCode"
				placeholder="Ingrese el código de verificacion"></b-form-input>
			</b-form-group>
			<b-form-group>
				<b-button
				:disabled="!is_code_typed"
				@click="checkVerificationCode"
				block
				variant="success">
					<btn-loader
					text="Verificar"
					:loader="loading_verification_code"></btn-loader>
				</b-button>
			</b-form-group>
		</div>
		<div
		v-if="verification_code_send && code_verified">
			<p>
				Ingrese su nueva contraseña.
			</p>
			<b-form-group>
				<b-form-input
				v-model="register_user.password"
				type="password"
				placeholder="Ingrese su nueva contraseña"></b-form-input>
			</b-form-group>
			<b-form-group>
				<b-form-input
				v-model="register_user.password_confirm"
				type="password"
				placeholder="Confirme su nueva contraseña"></b-form-input>
			</b-form-group>
			<b-form-group>
				<b-button
				:disabled="!is_password_typed"
				@click="updatePassword"
				block
				variant="success">
					<btn-loader
					text="Actualizar contraseña"
					:loader="loading_update_password"></btn-loader>
				</b-button>
			</b-form-group>
		</div>
	</b-card>
</template>
<script>
import BtnLoader from '@/components/common/BtnLoader'
import auth from '@/mixins/auth'
export default {
	mixins: [auth],
	components: {
		BtnLoader
	},
	computed: {
		link() {
			return process.env.VUE_APP_APP_URL+'/terminos-y-condiciones'
		},
		check() {
			return !this.register_user.terminos_y_condiciones
		},
		is_code_typed() {
			if (this.register_user.verification_code.length < 6) {
				return false
			}
			return true
		},
		is_password_typed() {
			if (this.register_user.password.length > 5 && this.register_user.password == this.register_user.password_confirm) {
				return true
			}
			return false
		},
	},
	data() {
		return {
			register_user: {
				email: '',
				verification_code: '',
				password: '',
				password_confirm: '',
			},
			verification_code_send: false,
			code_verified: false,
			loading_verification_code: false,
			loading_update_password: false,
			loading: false
		}
	},
	methods: {
		sendCode() {
			if (this.checkForm()) {
				this.loading = true
				this.$axios.post('password-reset/send-verification-code', {
					email       : this.register_user.email,
					commerce_id : process.env.VUE_APP_COMMERCE_ID
				})
				.then(res => {
					this.loading = false
					if (res.data.email_send) {
						this.verification_code_send = true
					} else {
						this.$toast.error('Revise su correo')
					}
				})
				.catch(err => {
					console.log(err)
					this.loading = false
				})
			}
		},
		checkVerificationCode() {
			if (this.is_code_typed) {
				this.loading_verification_code = true
				this.$axios.post('/password-reset/check-verification-code', {
					...this.register_user,
					commerce_id : process.env.VUE_APP_COMMERCE_ID
				})
				.then(res => {
					this.loading_verification_code = false
					if (res.data.verified) {
						this.code_verified = true
					} else {
						this.register_user.verification_code = ''
						this.$toast.error('El codigo ingresado no es correcto')
					}
				})
				.catch(err => {
					this.loading_verification_code = false
					console.log(err)
				})
			}
		},
		updatePassword() {
			if (this.checkPassword()) {
				this.loading_update_password = true
				this.$axios.post('password-reset/update-password', {
					...this.register_user,
					commerce_id : process.env.VUE_APP_COMMERCE_ID
				})
				.then(() => {
	        		this.$store.commit('auth/setLoading', true)
					this.$store.dispatch('auth/me')
					.then(() => {
	        			this.$store.commit('auth/setLoading', false)
	        			this.$router.push({name: 'Home'})
					})
				})
				.catch(err => {
					this.loading_update_password = false
					console.log(err)
				})
			}
		},
		checkForm() {
			if (this.register_user.email == '') {
				this.$toast.error('Ingresa tu correo')
				return false
			}
			return true
		},
		checkPassword() {
			if (this.register_user.password == '') {
				this.$toast.error('Ingrese una nueva contraseña')
				return false
			}
			if (this.register_user.password_confirm == '') {
				this.$toast.error('Confirme la nueva contraseña')
				return false
			}
			if (this.register_user.password != this.register_user.password_confirm) {
				this.$toast.error('Las contraseñas no coinciden')
				return false
			}
			return true
		}
	}
}
</script>
<style lang="sass">
.form-register
	.custom-checkbox
		text-align: left
</style>