<template>
<b-modal id="update-password" hide-footer hide-header>
	<b-form-group
	label="Contraseña actual">
		<b-form-input
		placeholder="Ingrese la contraseña actual"
		v-model="form.current_password"></b-form-input>
	</b-form-group>
	<b-form-group
	label="Nueva contraseña">
		<b-form-input
		placeholder="Ingrese la nueva contraseña"
		v-model="form.new_password"></b-form-input>
	</b-form-group>
	<b-form-group
	label="Confirmar nueva contraseña">
		<b-form-input
		placeholder="Confirme la nueva contraseña"
		v-model="form.confirm_new_password"></b-form-input>
	</b-form-group>
	<b-form-group>
		<b-button
		@click="update"
		block
		variant="success">
			<btn-loader
			text="Actualizar"
			:loader="loading"></btn-loader>
		</b-button>
	</b-form-group>
</b-modal>
</template>
<script>
import BtnLoader from '@/components/common/BtnLoader'
export default {
	components: {
		BtnLoader,
	},
	data() {
		return {
			form: {
				current_password: '',
				new_password: '',
				confirm_new_password: '',
			},
			loading: false,
		}
	},
	methods: {
		update() {
			if (this.check()) {
				this.loading = true
				this.$api.put('/buyer/password', this.form)
				.then(res => {
					this.loading = false
					if (res.data.updated) {
						this.$toast.success('Contraseña actualizada')
						this.$bvModal.hide('update-password')
					} else {
						this.$toast.error('La contraseña actual es incorrecta')
					}
				})
				.catch(err => {
					this.loading = false
					this.$toast.error('Error al actualizar la contraseña')
					console.log(err)
				})
			}
		},
		check() {
			if (this.form.current_password == '') {
				this.$toast.error('Ingrese la contraseña actual')
				return false
			}
			if (this.form.new_password == '') {
				this.$toast.error('Ingrese la nueva contraseña')
				return false
			}
			if (this.form.confirm_new_password == '') {
				this.$toast.error('Confirme la nueva contraseña')
				return false
			}
			if (this.form.new_password != this.form.confirm_new_password) {
				this.$toast.error('Las nuevas contraseñas no coinciden')
				return false
			}
			return true
		}
	}
}
</script>