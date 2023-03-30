<template>
<b-modal
id="advise"
title="Aviso de disponibilidad"
hide-footer>
	<b-form-group
	label="Correo electronico para enviar la notificacion">
		<b-form-input
		v-model="email"
		@keyup.enter="save"
		placeholder="Correo electronico"></b-form-input>
	</b-form-group>
	<b-button
	block 
	@click="save"
	variant="success">
		<btn-loader
		:loader="loading"
		text="Enviar"></btn-loader>
	</b-button>
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
			email: '',
			loading: false
		}
	},
	methods: {
		save() {
			if (this.check() && !this.loading)
			this.loading = true 
			this.$api.post('advises', {
				article_id: this.article_to_show.id,
				email: this.email
			})
			.then(res => {
				this.loading = false 
				this.$toast.success('Te avisaremos cuando este disponible')
				this.$bvModal.hide('advise')
			})
			.catch(err => {
				this.loading = false 
				console.log(err)
			})
		},
		check() {
			if (this.email == '') {
				this.$toast.warning('Ingrese su correo')
				return false
			}
			return true
		}
	}
}
</script>