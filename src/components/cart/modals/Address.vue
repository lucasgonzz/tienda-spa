<template>
<b-modal
v-if="user"
id="address"
title="Direccion"
hide-footer
hide-header>
	<p>¿A que direccion lo enviamos?</p>
	<b-form-group
	label="Calle">
		<b-form-input
		@keydown.enter="ready"
		v-model="user.address"
		placeholder="Ingresa tu direccion"></b-form-input>
	</b-form-group>
	<b-form-group
	label="Numero">
		<b-form-input
		@keydown.enter="ready"
		v-model="user.address_number"
		placeholder="Ingresa la altura"></b-form-input>
	</b-form-group>
	<b-form-group>
		<b-button
		variant="success"
		block
		@click="ready">
			<btn-loader
			text="Listo"
			:loader="loading">
			</btn-loader>
		</b-button>
	</b-form-group>
</b-modal>
</template>
<script>
import BtnLoader from '@/components/common/BtnLoader'
export default {
	components: {
		BtnLoader
	},
	data() {
		return {
			loading: false
		}
	},
	computed: {
		user() {
			return this.$store.state.auth.user
		}
	},
	methods: {
		ready() {
			if (this.check()) {
				this.loading = true
				this.$api.put('/buyer', this.user)
				.then(() => {
					this.loading = false
					this.$bvModal.hide('address')
					this.$bvModal.show('description')
					// this.$bvModal.show('payment-method')
				})
				.catch(err => {
					this.loading = false
					console.log(err)
				})
			}
		},
		check() {
			if (!this.user.address || this.user.address == '') {
				this.$toast.error('Ingrese una direccion valida, por favor')
				return false
			}
			if (!this.user.address_number || this.user.address_number == '') {
				this.$toast.error('Ingrese un numero de direccion valido, por favor')
				return false
			}
			return true
		}
	}
}
</script>