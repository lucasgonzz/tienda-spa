<template>
<b-modal v-if="user" id="update-email" hide-footer hide-header>
	<b-form-group
	label="Correo electronico">
		<b-form-input
		@keyup.enter="update"
		type="email"
		placeholder="Ingresar su correo electronico"
		v-model="user.email"></b-form-input>
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
			loading: false,
		}
	},
	methods: {
		update() {
			if (this.check()) {
				this.loading = true
				this.$api.put('/buyer', this.user)
				.then(res => {
					this.loading = false
					this.$toast.success('Correo actualizado')
					this.$bvModal.hide('update-email')
				})
				.catch(err => {
					this.loading = false
					this.$toast.error('Error al actualizar el correo')
					console.log(err)
				})
			}
		},
		check() {
			if (this.user.email == '') {
				this.$toast.error('El correo electronico no puede quedar vacio')
				return false
			}
			return true
		}
	}
}
</script>