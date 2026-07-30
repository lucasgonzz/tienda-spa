<template>
	<!--
		Grupo 281 (prompt 01): se saca la b-card -- AuthLayout ya pone el panel blanco
		y el titulo ("Crea tu cuenta"), asi que la card de aca adentro duplicaba el marco
		y repetia el titulo ("Registro"). El componente pasa a ser un div plano.
		Los campos reusan las clases "login-form__*" que dejo el grupo 279 en
		src/components/login/components/Form.vue -- esas clases NO estan "scoped" (se
		compilan globales) y Login.vue se importa siempre de forma eager desde el router
		(sin lazy-loading de rutas), asi que su CSS ya esta disponible sin necesidad de
		mover nada a un archivo sass compartido.
	-->
	<div
	v-if="view == 'formulario'"
	class="form-register">
		<div class="login-form__field">
			<label
			class="login-form__label"
			for="register_name">Nombre y apellido</label>
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
				v-model="register_user.name"
				id="register_name"
				autocomplete="name"
				placeholder="Nombre y apellido"></b-form-input>
			</div>
		</div>
		<!-- <div class="login-form__field">
			<b-form-input
			v-model="register_user.surname"
			placeholder="Apellido"></b-form-input>
		</div> -->
		<div class="login-form__field">
			<label
			class="login-form__label"
			for="register_phone">Telefono</label>
			<div class="login-form__input-row">
				<span
				class="login-form__input-icon"
				aria-hidden="true">
					<svg
					class="login-form__icon-svg"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg">
						<path fill="currentColor" d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.57.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.57 1 1 0 01-.25 1.01l-2.2 2.21z" />
					</svg>
				</span>
				<!-- El placeholder original ("Telefono sin 0 ni 15...") es informacion util
				para completar bien el campo, no decorado -- se mantiene igual aunque la
				etiqueta de arriba ahora diga solo "Telefono". -->
				<b-form-input
				class="login-form__control"
				v-model="register_user.phone"
				id="register_phone"
				autocomplete="tel"
				placeholder="Telefono sin 0 ni 15. Ej: 3444622139"></b-form-input>
			</div>
		</div>
		<div class="login-form__field">
			<label
			class="login-form__label"
			for="register_email">Correo electronico</label>
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
				id="register_email"
				autocomplete="email"
				placeholder="Correo electronico"></b-form-input>
			</div>
		</div>
		<div class="login-form__field">
			<label
			class="login-form__label"
			for="register_ciudad">Ciudad</label>
			<div class="login-form__input-row">
				<span
				class="login-form__input-icon"
				aria-hidden="true">
					<svg
					class="login-form__icon-svg"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg">
						<path fill="currentColor" d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
					</svg>
				</span>
				<b-form-input
				class="login-form__control"
				v-model="register_user.ciudad"
				id="register_ciudad"
				placeholder="Ciudad"></b-form-input>
			</div>
		</div>
		<!-- Campo condicional: se mantiene exactamente la misma condicion que tenia antes -->
		<div
		v-if="commerce.online_configuration.pedir_barrio_al_registrarse"
		class="login-form__field">
			<label
			class="login-form__label"
			for="register_barrio">Barrio</label>
			<div class="login-form__input-row">
				<span
				class="login-form__input-icon"
				aria-hidden="true">
					<svg
					class="login-form__icon-svg"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg">
						<path fill="currentColor" d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
					</svg>
				</span>
				<b-form-input
				class="login-form__control"
				v-model="register_user.barrio"
				id="register_barrio"
				placeholder="Barrio"></b-form-input>
			</div>
		</div>
		<div class="login-form__field">
			<label
			class="login-form__label"
			for="register_address">Direccion</label>
			<div class="login-form__input-row">
				<span
				class="login-form__input-icon"
				aria-hidden="true">
					<svg
					class="login-form__icon-svg"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg">
						<path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
					</svg>
				</span>
				<b-form-input
				class="login-form__control"
				v-model="register_user.address"
				id="register_address"
				autocomplete="street-address"
				placeholder="Direccion"></b-form-input>
			</div>
		</div>
		<div class="login-form__field">
			<label
			class="login-form__label"
			for="register_password">Contraseña</label>
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
				id="register_password"
				autocomplete="new-password"
				placeholder="Contraseña"></b-form-input>
			</div>
		</div>
		<!-- <div class="login-form__field">
			<b-form-input
			v-model="register_user.confirm_password"
			type="password"
			placeholder="Confirma la contraseña"></b-form-input>
		</div> -->
		<!-- <b-form-group>
			<b-form-checkbox
			v-model="register_user.terminos_y_condiciones">
				Acepto los <a :href="link" target="_blank">Términos y Condiciones de Uso</a>
			</b-form-checkbox>
		</b-form-group> -->
		<b-button
		@click="register"
		block
		class="login-form__submit-btn"
		variant="primary">
			<btn-loader
			text="Registrarme"
			:loader="loading"></btn-loader>
		</b-button>

		<div
		v-if="text_notificacion != ''">
			<b-alert
			show>
				<h4 class="alert-heading">Registro completado</h4>
				<strong>{{ text_notificacion }}</strong>
			</b-alert>

			<b-button
			block
			variant="primary"
			:to="{name: 'Home', params: {category: 'ultimos-ingresados'}}">
				Ir al inicio
			</b-button>
		</div>
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
		link() {
			return process.env.VUE_APP_APP_URL+'/terminos-y-condiciones'
		},
	},
	data() {
		return {
			register_user: {
				name: '',
				surname: '',
				phone: '',
				email: '',
				ciudad: '',
				barrio: '',
				address: '',
				password: '',
				confirm_password: '',
				terminos_y_condiciones: false,
			},
			text_notificacion: '',
			loading: false
		}
	},
	methods: {
		register() {
			if (this.checkForm() && !this.loading) {
				this.loading = true
				this.$axios.post('/register', {
					...this.register_user,
					commerce_id : process.env.VUE_APP_COMMERCE_ID
				})
				.then(res => {
					this.loading = false
					if (res.status == 201) {

						if (this.commerce.online_configuration.logear_cliente_al_registrar) {
							this.logear_y_redirigir(res)
						} else {
							this.notificacion()
						}


					} else {
						this.$toast.error('Ya hay un usuario registrado con esta informacion, intente con otro, por favor.')
						this.loading = false
					}
				})
				.catch(err => {
					console.log(err)
					this.loading = false
					this.$toast.error('Error al registrarse, probá ingresando con tu cuenta de google')
				})
			}
		},
		notificacion() {
			this.text_notificacion = 'Gracias por su registro, nos pondremos en contacto para otorgarle el acceso al sistema con su alta de usuario'
		},
		logear_y_redirigir(res) {

			this.$store.commit('auth/setAuthenticated', true)
			this.$store.commit('auth/setUser', res.data.buyer)
			
			this.redirectAfterLogin()
		},
		checkForm() {
			if (this.register_user.name == '') {
				this.$toast.error('El nombre no puede quedar vacio')
				return false
			}
			// if (this.register_user.surname == '') {
			// 	this.$toast.error('El apellido no puede quedar vacio')
			// 	return false
			// }
			if (this.register_user.phone == '') {
				this.$toast.error('El telefono no puede quedar vacio')
				return false
			}
			// if (this.register_user.phone.length < 10) {
			// 	this.$toast.error('El telefono es demasiado corto')
			// 	return false
			// }
			if (this.register_user.email == '') {
				this.$toast.error('El email no puede quedar vacio')
				return false
			}
			// if (!this.isEmail(this.register_user.email)) {
			// 	this.$toast.error('Ingresa un correo valido')
			// 	return false
			// }
			if (this.register_user.password == '') {
				this.$toast.error('La contraseña no puede quedar vacia')
				return false
			}
			// if (this.register_user.confirm_password == '') {
			// 	this.$toast.error('Confirme su contraseña')
			// 	return false
			// }
			// if (this.register_user.password != this.register_user.confirm_password) {
			// 	this.$toast.error('Las contraseñas no coinciden')
			// 	return false
			// }
			return true
		} 
	}
}
</script>
<style lang="sass">
.form-register
	.custom-checkbox
		text-align: left
	// El bloque de "registro completado" quedaba separado del boton por el margen que
	// daba el b-form-group que se saco junto con la b-card; se repone aca para que no
	// quede pegado al boton "Registrarme".
	.alert
		margin-top: 1.25rem
</style>