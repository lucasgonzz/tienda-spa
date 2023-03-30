<template>
	<b-card
	v-if="view == 'codigo-de-verificacion'"
	class="form-register"
	title="Registro">
		<p class="text-center">
			Enviamos un código de verificacion a {{ user.email }}.
		</p>
		<b-form-group>
			<b-form-input
			v-model="verification_code"
			type="number"
			@keyup.enter="checkVerificationCode"
			placeholder="Ingrese el código de verificacion"></b-form-input>
		</b-form-group>
		<b-form-group
		class="j-start">
			<b-button
			@click="resendCode"
			variant="link">
				<btn-loader
				text="Reenviar codigo"
				:loader="loading_resend_code"></btn-loader>
			</b-button>
		</b-form-group>
		<p class="text-muted text-left">
			Si no encuentra el correo, búsquelo en la sección de SPAM e indique que no es spam, para que podamos contactarnos correctamente en caso que realice un pedido.
		</p>
		<b-form-group>
			<b-button
			:disabled="!is_code_typed"
			@click="checkVerificationCode"
			block
			variant="success">
				<btn-loader
				text="Verificar"
				:loader="loading"></btn-loader>
			</b-button>
		</b-form-group>
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
		is_code_typed() {
			if (this.verification_code.length < 6) {
				return false
			}
			return true
		}
	},
	data() {
		return {
			verification_code: '',
			loading: false,
			loading_resend_code: false,
		}
	},
	methods: {
		resendCode() {
			this.loading_resend_code = true
			this.$axios.post('/register/resend-code')
			.then(res => {
				this.loading_resend_code = false
				this.$toast.success('Codigo reenviado')
			})
			.catch(err => {
				console.log(err)
				this.loading_resend_code = false
			})
		},
		checkVerificationCode() {
			if (this.is_code_typed) {
				this.loading = true
				this.$axios.post('/register/verify-code', {
					verification_code: this.verification_code,
				})
				.then(res => {
					if (res.data.verified) {
						this.user.verification_code = null
						this.redirectAfterLogin()
					} else {
						this.loading = false
						this.verification_code = ''
						this.$toast.error('El codigo ingresado no es correcto')
					}
				})
				.catch(err => {
					this.loading = false
					console.log(err)
				})
			}
		},
		checkForm() {
			if (this.register_user.name == '') {
				this.$toast.error('El nombre no puede quedar vacio')
				return false
			}
			if (this.register_user.surname == '') {
				this.$toast.error('El apellido no puede quedar vacio')
				return false
			}
			if (this.register_user.phone == '') {
				this.$toast.error('El telefono no puede quedar vacio')
				return false
			}
			if (this.register_user.phone.length < 10) {
				this.$toast.error('El telefono es demasiado corto')
				return false
			}
			if (this.register_user.email == '') {
				this.$toast.error('El email no puede quedar vacio')
				return false
			}
			if (!this.isEmail(this.register_user.email)) {
				this.$toast.error('Ingresa un correo valido')
				return false
			}
			if (this.register_user.password == '') {
				this.$toast.error('La contraseña no puede quedar vacia')
				return false
			}
			if (this.register_user.confirm_password == '') {
				this.$toast.error('Confirme su contraseña')
				return false
			}
			if (this.register_user.password != this.register_user.confirm_password) {
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