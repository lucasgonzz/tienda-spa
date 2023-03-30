<template>
<b-modal v-if="user" id="update-name" hide-footer hide-header>
	<b-form-group
	label="Nombre">
		<b-form-input
		v-model="user.name"></b-form-input>
	</b-form-group>
	<b-form-group
	label="Apellido">
		<b-form-input
		v-model="user.surname"></b-form-input>
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
				.then(() => {
					this.loading = false
					this.$toast.success('Datos actualizados')
					this.$bvModal.hide('update-name')
				})
				.catch(err => {
					this.loading = false
					this.$toast.error('Error al actualizar datos')
					console.log(err)
				})
			}
		},
		check() {
			if (this.user.name == '') {
				this.$toast.error('El nombre no puede quedar vacio')
				return false
			}
			if (this.user.surname == '') {
				this.$toast.error('El apelldio no puede quedar vacio')
				return false
			}
			return true
		}
	}
}
</script>