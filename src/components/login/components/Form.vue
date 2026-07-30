<template>
	<div class="login-form">
		<!--
			Campo de email/telefono. OJO: el nombre "email" y el mensaje de error del toast
			("Ingrese su telefono, por favor", ver checkLogin() en mixins/auth.js) quedan
			intencionalmente tal cual estan hoy -- es una inconsistencia conocida (algunas
			tiendas ingresan con telefono) que decide Lucas, no este prompt.
		-->
		<div class="login-form__field">
			<label
			class="login-form__label"
			for="login_email">Email</label>
			<div class="login-form__input-row">
				<span
				class="login-form__input-icon"
				aria-hidden="true">
					<svg
					class="login-form__icon-svg"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg">
						<path fill="currentColor" d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
					</svg>
				</span>
				<b-form-input
				class="login-form__control"
				@keydown.enter="login(user_login)"
				v-model="user_login.email"
				id="login_email"
				autocomplete="username"
				placeholder="Email"></b-form-input>
			</div>
		</div>
		<div class="login-form__field">
			<label
			class="login-form__label"
			for="login_password">Contraseña</label>
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
				v-model="user_login.password"
				type="password"
				@keydown.enter="login(user_login)"
				id="login_password"
				autocomplete="current-password"
				placeholder="Contraseña"></b-form-input>
			</div>
		</div>
		<!-- Fila "Recordarme" + "Olvide mi contraseña": checkbox alineado a la izquierda (antes quedaba pegado a la derecha), link discreto a la derecha -->
		<div class="login-form__remember-row">
			<b-form-checkbox
			v-model="user_login.remember">
				Recordarme
			</b-form-checkbox>
			<b-link
			class="login-form__forgot-link"
			:to="{name: 'PasswordReset'}">
				Olvide mi contraseña
			</b-link>
		</div>
		<b-button
		:disabled="disabled"
		@click="login(user_login)"
		block
		class="login-form__submit-btn"
		variant="primary">
			<btn-loader
			text="Ingresar"
			:loader="loading">
			</btn-loader>
		</b-button>
		<!-- Enlace al registro: mismo destino ({name: 'Register', params: {view: 'formulario'}}) que usaba toRegister() cuando el boton "Registrarse" vivia en Login.vue -->
		<p class="login-form__register-text">
			¿Todavia no tenes cuenta?
			<b-link :to="{name: 'Register', params: {view: 'formulario'}}">Crear cuenta</b-link>
		</p>
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
@import '@/sass/_custom'

// Campo individual (label + fila de input con icono)
.login-form__field
	margin-bottom: 1.25rem

.login-form__label
	display: block
	font-size: 0.8125rem
	font-weight: 500
	color: var(--text-color)
	opacity: 0.75
	margin-bottom: 0.4rem
	@if ($theme == dark)
		color: #f2f2f2

.login-form__input-row
	display: flex
	align-items: center
	background: #ffffff
	border: 1px solid #e5e7eb
	border-radius: 8px
	padding-left: 0.75rem
	transition: border-color 0.15s ease, box-shadow 0.15s ease
	// Anillo de foco con el color de marca del comercio
	&:focus-within
		border-color: var(--primary-color)
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 15%, transparent)
	// Pinta toda la fila (icono + input) cuando el navegador autocompleta
	&:has(.login-form__control:-webkit-autofill),
	&:has(.login-form__control:autofill)
		background: #fff9c4
	@if ($theme == dark)
		background: #232323
		border-color: #333

.login-form__input-icon
	display: flex
	align-items: center
	justify-content: center
	color: #9ca3af
	flex-shrink: 0
	padding-right: 0.5rem

.login-form__icon-svg
	width: 20px
	height: 20px
	display: block

.login-form__control
	border: none !important
	background: transparent !important
	box-shadow: none !important
	padding-left: 0.25rem !important
	height: 48px !important
	font-size: 0.9375rem
	&:focus
		box-shadow: none !important
	@if ($theme == dark)
		color: #f2f2f2 !important

// Autocompletado del navegador: fondo amarillo uniforme en todo el campo (va junto con el
// :has() de arriba -- copiar solo una de las dos reglas deja el campo a medio pintar)
.login-form__control:-webkit-autofill,
.login-form__control:-webkit-autofill:hover,
.login-form__control:-webkit-autofill:focus,
.login-form__control:-webkit-autofill:active,
.login-form__control:autofill
	-webkit-box-shadow: 0 0 0 1000px #fff9c4 inset !important
	box-shadow: 0 0 0 1000px #fff9c4 inset !important
	-webkit-text-fill-color: #111827 !important
	caret-color: #111827
	transition: background-color 5000s ease-in-out 0s

// Fila "Recordarme" + "Olvide mi contraseña"
.login-form__remember-row
	display: flex
	align-items: center
	justify-content: space-between
	margin-bottom: 1.25rem

.login-form__forgot-link
	font-size: 0.875rem
	color: var(--text-color)
	opacity: 0.65
	text-decoration: none
	&:hover
		color: var(--primary-color)
		opacity: 1
		text-decoration: underline

// Boton principal: solido con el color de marca, texto legible con la variable que ya
// define el tema para eso (--hover-text-color)
.login-form__submit-btn.btn
	background: var(--primary-color) !important
	border-color: var(--primary-color) !important
	color: var(--hover-text-color) !important
	font-weight: 600
	border-radius: 8px
	height: 48px
	&:hover,
	&:focus,
	&:active
		background: color-mix(in srgb, var(--primary-color) 90%, black 10%) !important
		border-color: color-mix(in srgb, var(--primary-color) 90%, black 10%) !important
	&:disabled
		opacity: 0.7

// Linea final con el link al registro
.login-form__register-text
	text-align: center
	font-size: 0.875rem
	color: var(--text-color)
	opacity: 0.75
	margin-top: 1.25rem
	margin-bottom: 0
	@if ($theme == dark)
		color: #f2f2f2
	a
		color: var(--primary-color)
		font-weight: 600
		text-decoration: none
		&:hover
			text-decoration: underline
</style>
