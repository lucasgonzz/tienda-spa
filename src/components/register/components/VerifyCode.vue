<template>
	<!--
		Grupo 281 (prompt 01): igual que Form.vue, se saca la b-card -- AuthLayout ya
		pone el marco y el titulo. El campo del codigo reusa las clases "login-form__*"
		del login (no estan scoped, quedan disponibles globales). Se agrega la clase
		propia "verify-code__control" solo para el detalle que el login no necesita:
		texto centrado y con letter-spacing, porque este campo es un codigo numerico
		corto que se tipea desde el celular.
	-->
	<div
	v-if="view == 'codigo-de-verificacion'"
	class="form-register">
		<p class="text-center">
			Enviamos un código de verificacion a {{ user.email }}.
		</p>
		<div class="login-form__field">
			<label
			class="login-form__label"
			for="verify_code">Código de verificación</label>
			<div class="login-form__input-row">
				<span
				class="login-form__input-icon"
				aria-hidden="true">
					<svg
					class="login-form__icon-svg"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg">
						<path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h2v2H6V9zm4 0h2v2h-2V9zm4 0h2v2h-2V9z" />
					</svg>
				</span>
				<!-- inputmode numeric + autocomplete one-time-code: pensado para que en el
				celular aparezca el teclado numerico y, si el navegador soporta autofill de
				OTP por SMS, complete el codigo solo. Texto centrado con letter-spacing via
				la clase propia de abajo, para que se lea como un codigo y no como texto libre. -->
				<b-form-input
				class="login-form__control verify-code__control"
				v-model="verification_code"
				type="number"
				id="verify_code"
				inputmode="numeric"
				autocomplete="one-time-code"
				@keyup.enter="checkVerificationCode"
				placeholder="Ingrese el código de verificacion"></b-form-input>
			</div>
		</div>
		<div class="j-start verify-code__resend">
			<b-button
			@click="resendCode"
			variant="link">
				<btn-loader
				text="Reenviar codigo"
				:loader="loading_resend_code"></btn-loader>
			</b-button>
		</div>
		<p class="text-muted text-left">
			Si no encuentra el correo, búsquelo en la sección de SPAM e indique que no es spam, para que podamos contactarnos correctamente en caso que realice un pedido.
		</p>
		<b-button
		:disabled="!is_code_typed"
		@click="checkVerificationCode"
		block
		class="login-form__submit-btn"
		variant="primary">
			<btn-loader
			text="Verificar"
			:loader="loading"></btn-loader>
		</b-button>
	</div>
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

// Codigo numerico corto: se lee mejor centrado y con un poco de separacion entre
// caracteres que como texto libre alineado a la izquierda.
.verify-code__control
	text-align: center !important
	letter-spacing: 0.3em !important
	font-weight: 600

// El link "Reenviar codigo" y el parrafo de ayuda del SPAM quedaban separados del
// campo por el margen del b-form-group que se saco junto con la b-card.
.verify-code__resend
	margin-bottom: 1.25rem
</style>