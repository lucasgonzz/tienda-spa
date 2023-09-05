<template>
	<b-card
	v-if="view == 'formulario'"
	class="form-register"
	title="Registro">
		<b-form-group>
			<b-form-input
			v-model="register_user.name"
			placeholder="Nombre y apellido"></b-form-input>
		</b-form-group>
		<!-- <b-form-group>
			<b-form-input
			v-model="register_user.surname"
			placeholder="Apellido"></b-form-input>
		</b-form-group> -->
		<b-form-group>
			<b-form-input
			v-model="register_user.phone"
			placeholder="Telefono sin 0 ni 15. Ej: 3444622139"></b-form-input>
		</b-form-group>
		<b-form-group>
			<b-form-input
			v-model="register_user.email"
			placeholder="Correo electronico"></b-form-input>
		</b-form-group>
		<b-form-group>
			<b-form-input
			v-model="register_user.password"
			type="password"
			placeholder="Contraseña"></b-form-input>
		</b-form-group>
		<b-form-group>
			<b-form-input
			v-model="register_user.confirm_password"
			type="password"
			placeholder="Confirma la contraseña"></b-form-input>
		</b-form-group>
		<b-form-group>
			<b-form-checkbox
			v-model="register_user.terminos_y_condiciones">
				Acepto los <a :href="link" target="_blank">Términos y Condiciones de Uso</a>
			</b-form-checkbox>
		</b-form-group>
		<b-form-group>
			<b-button
			:disabled="check"
			@click="register"
			block
			variant="success">
				<btn-loader
				text="Registrarme"
				:loader="loading"></btn-loader>
			</b-button>
		</b-form-group>
	</b-card>
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
		check() {
			return !this.register_user.terminos_y_condiciones
		},
	},
	data() {
		return {
			register_user: {
				name: '',
				surname: '',
				phone: '',
				email: '',
				password: '',
				confirm_password: '',
				terminos_y_condiciones: false,
			},
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
					// this.loading = false
					if (res.status == 201) {
						this.$store.commit('auth/setAuthenticated', true)
						this.$store.commit('auth/setUser', res.data.buyer)
						this.home()
						// this.$router.replace({name : this.route_name, params: {view: 'codigo-de-verificacion'}})
						// this.login(this.register_user)
					} else {
						this.$toast.error('Ya hay un usuario registrado con esta informacion, intente con otro, por favor.')
					}
				})
				.catch(err => {
					console.log(err)
					this.loading = false
					this.$toast.error('Error al registrarse, probá ingresando con tu cuenta de google')
				})
			}
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