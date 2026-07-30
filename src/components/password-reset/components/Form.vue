<template>
	<!--
		Grupo 281 (prompt 02): se saca la b-card -- AuthLayout (PasswordReset.vue) ya pone
		el panel blanco y el titulo "Recuperar tu clave", asi que la card de aca adentro
		duplicaba el marco. El componente pasa a ser un div plano, igual que se hizo con
		el registro en el prompt 01 de este grupo. Los campos reusan las clases
		"login-form__*" que dejo el grupo 279 en src/components/login/components/Form.vue
		(no estan scoped, se compilan globales y Login.vue se importa eager desde el
		router) y el patron del campo de codigo se copia de
		src/components/register/components/VerifyCode.vue (clase propia
		"verify-code__control" para centrar y separar el texto).
		Se mantiene exactamente la misma logica de v-if de los tres pasos que tenia el
		componente original: no se toca cuando se muestra cada bloque, solo como se ve.
	-->
	<div class="form-register">
		<!-- Indicador chico de en que paso del flujo esta el usuario: no agrega logica
		nueva, se calcula con el computed "current_step" a partir de las mismas variables
		que ya deciden que bloque de abajo se muestra. -->
		<p class="login-form__step-indicator">Paso {{ current_step }} de 3</p>

		<!-- Paso 1: pedir el correo para enviar el codigo de recuperacion -->
		<div
		v-if="!verification_code_send">
			<!-- El texto de instrucciones ya no es el label del b-form-group (uso raro,
			se veia como etiqueta de campo): pasa a ser un parrafo propio arriba del campo. -->
			<p class="login-form__step-instructions">
				Ingresa tu correo para que te enviemos un código de recuperación.
			</p>
			<div class="login-form__field">
				<label
				class="login-form__label"
				for="password_reset_email">Correo electronico</label>
				<div class="login-form__input-row">
					<span
					class="login-form__input-icon"
					aria-hidden="true">
						<svg
						class="login-form__icon-svg"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg">
							<path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
						</svg>
					</span>
					<b-form-input
					class="login-form__control"
					v-model="register_user.email"
					@keyup.enter="sendCode"
					id="password_reset_email"
					autocomplete="email"
					placeholder="Correo electronico"></b-form-input>
				</div>
			</div>
			<b-button
			@click="sendCode"
			block
			class="login-form__submit-btn"
			variant="primary">
				<btn-loader
				text="Enviar codigo"
				:loader="loading"></btn-loader>
			</b-button>
		</div>

		<!-- Paso 2: ingresar el codigo de verificacion recibido por correo -->
		<div
		v-if="verification_code_send && !code_verified">
			<p class="text-left">
				Enviamos un código de verificación a {{ register_user.email }}, si no encuentras el correo revisa la lista de SPAM.
			</p>
			<div class="login-form__field">
				<label
				class="login-form__label"
				for="password_reset_code">Código de verificación</label>
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
					<!-- inputmode numeric + autocomplete one-time-code, texto centrado con
					letter-spacing via la clase propia "verify-code__control": mismo tratamiento
					que el codigo de verificacion del registro. -->
					<b-form-input
					class="login-form__control verify-code__control"
					v-model="register_user.verification_code"
					type="number"
					@keyup.enter="checkVerificationCode"
					id="password_reset_code"
					inputmode="numeric"
					autocomplete="one-time-code"
					placeholder="Ingrese el código de verificacion"></b-form-input>
				</div>
			</div>
			<b-button
			:disabled="!is_code_typed"
			@click="checkVerificationCode"
			block
			class="login-form__submit-btn"
			variant="primary">
				<btn-loader
				text="Verificar"
				:loader="loading_verification_code"></btn-loader>
			</b-button>
		</div>

		<!-- Paso 3: escribir la clave nueva (con su confirmacion) -->
		<div
		v-if="verification_code_send && code_verified">
			<p>
				Ingrese su nueva contraseña.
			</p>
			<div class="login-form__field">
				<label
				class="login-form__label"
				for="password_reset_password">Nueva contraseña</label>
				<div class="login-form__input-row">
					<span
					class="login-form__input-icon"
					aria-hidden="true">
						<svg
						class="login-form__icon-svg"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg">
							<path fill="currentColor" d="M18 8h-1V6a5 5 0 10-10 0v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zM9 6a3 3 0 116 0v2H9V6z" />
						</svg>
					</span>
					<b-form-input
					class="login-form__control"
					v-model="register_user.password"
					type="password"
					id="password_reset_password"
					autocomplete="new-password"
					placeholder="Ingrese su nueva contraseña"></b-form-input>
				</div>
			</div>
			<div class="login-form__field">
				<label
				class="login-form__label"
				for="password_reset_password_confirm">Confirmar contraseña</label>
				<div class="login-form__input-row">
					<span
					class="login-form__input-icon"
					aria-hidden="true">
						<svg
						class="login-form__icon-svg"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg">
							<path fill="currentColor" d="M18 8h-1V6a5 5 0 10-10 0v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zM9 6a3 3 0 116 0v2H9V6z" />
						</svg>
					</span>
					<b-form-input
					class="login-form__control"
					v-model="register_user.password_confirm"
					type="password"
					id="password_reset_password_confirm"
					autocomplete="new-password"
					placeholder="Confirme su nueva contraseña"></b-form-input>
				</div>
			</div>
			<b-button
			:disabled="!is_password_typed"
			@click="updatePassword"
			block
			class="login-form__submit-btn"
			variant="primary">
				<btn-loader
				text="Actualizar contraseña"
				:loader="loading_update_password"></btn-loader>
			</b-button>
		</div>
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
		// Calcula en que paso del flujo esta el usuario para el indicador visual
		// "Paso X de 3". Se arma con las mismas condiciones que ya deciden que bloque
		// de v-if se muestra, no agrega ninguna logica de negocio nueva.
		current_step() {
			if (this.verification_code_send && this.code_verified) {
				return 3
			}
			if (this.verification_code_send) {
				return 2
			}
			return 1
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
// Necesario para el $theme que usan los @if de dark mode de las reglas nuevas de
// abajo (indicador de paso y parrafo de instrucciones) -- login/components/Form.vue
// importa lo mismo por el mismo motivo.
@import '@/sass/_custom'

.form-register
	.custom-checkbox
		text-align: left

// Indicador chico "Paso X de 3": mismo tono discreto que el resto de textos
// auxiliares del formulario, no debe competir visualmente con el titulo del AuthLayout.
.login-form__step-indicator
	text-align: center
	font-size: 0.8125rem
	font-weight: 500
	color: var(--text-color)
	opacity: 0.6
	margin-bottom: 1rem
	@if ($theme == dark)
		color: #f2f2f2

// Parrafo de instrucciones del paso 1: reemplaza al label del b-form-group que se
// usaba antes como si fuera un parrafo (uso raro, se veia como etiqueta de campo).
.login-form__step-instructions
	font-size: 0.875rem
	color: var(--text-color)
	opacity: 0.8
	margin-bottom: 1rem
	@if ($theme == dark)
		color: #f2f2f2

// Codigo numerico corto: se lee mejor centrado y con un poco de separacion entre
// caracteres que como texto libre alineado a la izquierda (mismo tratamiento que
// src/components/register/components/VerifyCode.vue).
.verify-code__control
	text-align: center !important
	letter-spacing: 0.3em !important
	font-weight: 600
</style>
