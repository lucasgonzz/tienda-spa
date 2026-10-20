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
				Ingresá tu correo y te mandamos un código para que elijas una clave nueva.
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
				Te mandamos un código a {{ register_user.email }}. Si no lo ves, fijate en la carpeta de spam. El código vence en 30 minutos.
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
					que el codigo de verificacion del registro. Es type="text" (y no "number") a
					proposito: el codigo viaja como texto y el campo no se come los ceros ni deja
					escribir una "e". El formatter deja solo digitos y corta en 6, que es lo que
					puede mandar una API que todavia no genera codigos de 4. -->
					<b-form-input
					class="login-form__control verify-code__control"
					v-model="register_user.verification_code"
					type="text"
					:formatter="format_code"
					maxlength="6"
					@keyup.enter="checkVerificationCode"
					id="password_reset_code"
					inputmode="numeric"
					pattern="[0-9]*"
					autocomplete="one-time-code"
					placeholder="Código de 4 dígitos"></b-form-input>
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
			<!-- Si el codigo murio (vencio, o se equivoco 5 veces) o nunca llego, se vuelve al paso 1
			para pedir otro. -->
			<div class="password-reset__new-code">
				<b-button
				@click="ask_for_new_code"
				variant="link">
					Pedir un código nuevo
				</b-button>
			</div>
		</div>

		<!-- Paso 3: escribir la clave nueva (con su confirmacion) -->
		<div
		v-if="verification_code_send && code_verified">
			<p class="text-left">
				Elegí tu contraseña nueva. Tiene que tener al menos 6 caracteres.
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
import { env } from '@/runtime_config'
export default {
	mixins: [auth],
	components: {
		BtnLoader
	},
	computed: {
		link() {
			return env('VUE_APP_APP_URL')+'/terminos-y-condiciones'
		},
		check() {
			return !this.register_user.terminos_y_condiciones
		},
		is_code_typed() {
			// Desde el 20/10/2026 la API manda codigos de 4 digitos (los pide esta pantalla con
			// `longitud_del_codigo`); una API que todavia no lo soporta manda 6. Se acepta desde 4.
			if (this.register_user.verification_code.length < 4) {
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
					email       : this.register_user.email.trim(),
					commerce_id : env('VUE_APP_COMMERCE_ID'),
					// Pide el codigo de 4 digitos. La API que no conoce el campo lo ignora y manda uno de 6.
					longitud_del_codigo : 4
				})
				.then(res => {
					this.loading = false
					if (res.data.email_send) {
						this.verification_code_send = true
					} else {
						this.$toast.error('No encontramos una cuenta con ese correo en esta tienda. Revisalo e intentá de nuevo.')
					}
				})
				.catch(err => {
					console.log(err)
					this.loading = false
					// 429: demasiados intentos desde esta IP. Se avisa y se queda en el paso 1.
					if (this.show_too_many_attempts(err)) {
						return
					}
					// Desde el 14/10/2026 tienda-api responde 422 con `message` cuando el servidor de
					// correo rechaza el envio del codigo (antes era un 500 y aca no se avisaba nada).
					// Se muestra ese texto; ante cualquier otro error, uno generico.
					// Solo el 422 (y el 429 de arriba) trae un texto pensado para el comprador; cualquier otro
					// `message` (un 500, un 419) es interno y no se muestra.
					let message = err && err.response && err.response.status == 422 && err.response.data && err.response.data.message
					this.$toast.error(message || 'No pudimos enviarte el código. Probá de nuevo en unos minutos.')
				})
			}
		},
		checkVerificationCode() {
			if (this.is_code_typed) {
				this.loading_verification_code = true
				this.$axios.post('/password-reset/check-verification-code', {
					...this.register_user,
					commerce_id : env('VUE_APP_COMMERCE_ID')
				})
				.then(res => {
					this.loading_verification_code = false
					if (res.data.verified) {
						this.code_verified = true
					} else {
						this.register_user.verification_code = ''
						this.$toast.error('El código no es correcto o ya venció. Revisalo; si te equivocás varias veces vas a tener que pedir uno nuevo.')
					}
				})
				.catch(err => {
					this.loading_verification_code = false
					console.log(err)
					// 429: demasiados intentos desde esta IP. Se avisa y se queda en el paso 2 con el codigo escrito.
					if (this.show_too_many_attempts(err)) {
						return
					}
					this.$toast.error('No pudimos verificar el código. Probá de nuevo en unos minutos.')
				})
			}
		},
		updatePassword() {
			if (this.checkPassword()) {
				this.loading_update_password = true
				this.$axios.post('password-reset/update-password', {
					...this.register_user,
					commerce_id : env('VUE_APP_COMMERCE_ID')
				})
				.then(() => {
	        		this.$store.commit('auth/setLoading', true)
					this.$store.dispatch('auth/me')
					.then(() => {
	        			this.$store.commit('auth/setLoading', false)
	        			this.recargar_articulos_con_la_sesion()
	        			this.$router.push({name: 'Home'})
					})
					.catch(err => {
						// La contraseña ya se cambio: si no se pudo leer la sesion, que entre con ella.
						console.log(err)
						this.$store.commit('auth/setLoading', false)
						this.loading_update_password = false
						this.$toast.success('Cambiamos tu contraseña. Ingresá con la nueva.')
						this.$router.push({name: 'Login'})
					})
				})
				.catch(err => {
					this.loading_update_password = false
					console.log(err)
					// 429: demasiados intentos desde esta IP. Se avisa y se queda en el paso 3: el codigo sigue
					// vigente (no se gasto), asi que NO se manda a pedir uno nuevo.
					if (this.show_too_many_attempts(err)) {
						return
					}
					// Desde el 14/10/2026 la contraseña nueva se guarda solo con el código vigente: si
					// venció, tienda-api responde 422 con `message` y hay que pedir uno nuevo.
					let message = err && err.response && err.response.status == 422 && err.response.data && err.response.data.message
					this.$toast.error(message || 'No pudimos cambiar la contraseña. Probá de nuevo en unos minutos.')
					// El codigo ya no sirve (vencio o se agoto): hay que pedir uno nuevo desde el paso 1.
					if (err && err.response && err.response.status == 422) {
						this.ask_for_new_code()
					}
				})
			}
		},
		/**
		 * Si el error es un 429 (el throttle por IP de tienda-api: demasiados pedidos seguidos desde
		 * esta conexion), muestra el `message` de la API como toast de error (o un texto de respaldo
		 * si no viniera) y devuelve true; con cualquier otro error no hace nada y devuelve false.
		 * Quien llama apaga su loader y NO avanza de paso: la persona queda en la misma pantalla
		 * y puede reintentar pasado el tiempo.
		 *
		 * @param  {Object} err  Error de axios del .catch.
		 * @return {Boolean}     true si era un 429 y ya se aviso.
		 */
		show_too_many_attempts(err) {
			if (!err || !err.response || err.response.status != 429) {
				return false
			}
			let message = err.response.data && err.response.data.message
			this.$toast.error(message || 'Hiciste demasiados intentos. Esperá unos minutos y volvé a probar.')
			return true
		},
		/**
		 * Deja solo digitos y corta en 6 (maximo que puede mandar una API sin codigos de 4).
		 * Lo usa el b-form-input del codigo como formatter.
		 */
		format_code(value) {
			return String(value).replace(/\D/g, '').slice(0, 6)
		},
		/**
		 * Vuelve al paso 1 para pedir otro codigo: limpia el codigo y las contraseñas escritas,
		 * y deja el correo para no tener que tipearlo de nuevo.
		 */
		ask_for_new_code() {
			this.verification_code_send = false
			this.code_verified = false
			this.loading_update_password = false
			this.register_user.verification_code = ''
			this.register_user.password = ''
			this.register_user.password_confirm = ''
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

// Indicador chico "Paso X de 3": mismo tono discreto que el resto de textos
// auxiliares del formulario, no debe competir visualmente con el titulo del AuthLayout.
// Se queda centrado (text-align explicito, el default del subarbol ahora es left).
.login-form__step-indicator
	text-align: center
	font-size: 0.8125rem
	font-weight: 500
	// Tono muted fijo (definido en AuthLayout.vue), no la variable de tema general:
	// esa esta pensada para superficies coloreadas, no para el panel blanco del formulario.
	color: var(--auth-text-muted)
	margin-bottom: 1rem

// Parrafo de instrucciones del paso 1: reemplaza al label del b-form-group que se
// usaba antes como si fuera un parrafo (uso raro, se veia como etiqueta de campo).
// Alineado a la izquierda de forma explicita, igual criterio que las etiquetas.
.login-form__step-instructions
	font-size: 0.875rem
	color: var(--auth-text-muted)
	text-align: left
	margin-bottom: 1rem

// Link "Pedir un codigo nuevo" del paso 2: centrado debajo del boton de verificar.
.password-reset__new-code
	text-align: center
	margin-top: 0.5rem
	// Es un link de texto: sin la sombra ni el fondo que los botones de esta pantalla traen por defecto.
	.btn-link
		box-shadow: none !important
		background: transparent !important

// Codigo numerico corto: se lee mejor centrado y con un poco de separacion entre
// caracteres que como texto libre alineado a la izquierda (mismo tratamiento que
// src/components/register/components/VerifyCode.vue).
.verify-code__control
	text-align: center !important
	letter-spacing: 0.3em !important
	font-weight: 600
	// El texto de ayuda no lleva la separacion de los digitos: se leeria como letras sueltas.
	&::placeholder
		letter-spacing: normal
		font-weight: 400
</style>
