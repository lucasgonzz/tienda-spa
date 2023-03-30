<template>
<b-modal v-if="user" id="update-number" hide-footer hide-header>
	<b-form-group
	label="Numero de teléfono"
	description="Con el código de area, sin 0 ni 15. Ejemplo: 341 622139 ">
		<b-form-input
		@keyup.enter="update"
		type="number"
		placeholder="Ingresar numero de Teléfono"
		v-model="formated_phone"></b-form-input>
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
			phone: '',
			loading: false,
		}
	},
	computed: {
		formated_phone: {
			get() {
				if (this.user.phone) {
					return this.user.phone.substring(4)
				}
				return ''
			},
			set(value) {
				this.phone = '+549'+value
			},
		}
	},
	methods: {
		update() {
			if (this.check()) {
				this.loading = true
				this.$api.put('/buyer/phone', {
					phone: this.phone
				})
				.then(res => {
					this.loading = false
					if (res.data.phone_exist) {
						this.$toast.error('Ya hay un usuario con ese numero de telefono')
					} else {
						this.$toast.success('Numero actualizados')
						this.$bvModal.hide('update-number')
						this.user.phone = this.phone
					}
				})
				.catch(err => {
					this.loading = false
					this.$toast.error('Error al actualizar el numero')
					console.log(err)
				})
			}
		},
		check() {
			if (this.phone == '') {
				this.$toast.error('El numero no puede quedar vacio')
				return false
			}
			if (this.phone.length < 14) {
				this.$toast.error('El numero es corto, revisalo por favor')
				return false
			}
			return true
		}
	}
}
</script>