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
			// Si ya hay una peticion en curso, no se hace nada (evita doble click)
			if (this.loading) return
			// Si el email no pasa las validaciones de check(), no se postea nada
			if (!this.check()) return
			this.loading = true
			this.$api.post('advises', {
				article_id: this.article_to_show.id,
				// Se normaliza el email antes de enviarlo (sin espacios y en minusculas)
				email: this.email.trim().toLowerCase()
			})
			.then(res => {
				this.loading = false
				this.$toast.success('Te avisaremos cuando este disponible')
				// Se limpia el email para que no quede el valor viejo al reabrir el modal
				this.email = ''
				this.$bvModal.hide('advise')
			})
			.catch(err => {
				this.loading = false
				console.log(err)
				// Se avisa al usuario que algo fallo, antes quedaba en silencio
				this.$toast.error('No pudimos guardar tu aviso, intentá de nuevo')
			})
		},
		// Valida que el email no este vacio y que tenga un formato valido
		check() {
			if (this.email.trim() == '') {
				this.$toast.warning('Ingrese su correo')
				return false
			}
			// Regex simple para validar formato de correo electronico
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) {
				this.$toast.warning('Ingrese un correo válido')
				return false
			}
			return true
		}
	}
}
</script>