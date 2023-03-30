<template>
<b-modal
v-if="user"
id="description"
title="Observaciones"
hide-footer
hide-header>
	<b-form-group
	label="Nota para el pedido">
		<b-form-textarea
		@keydown.enter="ready"
		v-model="description"
		placeholder="¿Hay que envolver algo?"></b-form-textarea>
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
		BtnLoader,
	},
	data() {
		return {
			loading: false
		}
	},
	computed: {
		description: {
			get() {
				return this.$store.state.cart.cart.description
			},
			set(value) {
				this.$store.commit('cart/setDescription', value)
			} 
		},
	},
	methods: {
		ready() {
			this.$bvModal.hide('description')
			this.$bvModal.show('payment-method')
		},
	}
}
</script>