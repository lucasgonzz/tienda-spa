<template>
	<b-row
	class="view-p-t">
		<b-col
		cols="12"
		lg="4"
		xl="3">
			<h3
			class="text-left">
				Contacto
			</h3>
			<p
			class="text-left">
				{{ commerce.online_configuration.mensaje_contacto }}
			</p>
			<p
			class="text-left">
				<i class="icon-message"></i>
				{{ commerce.email }}
			</p>
		</b-col>
		<b-col
		cols="12"
		lg="8"
		xl="7">
			<b-form-group
			label="Nombre">
				<b-form-input
				v-model="form.name"
				id="name"
				placeholder="Ingrese su nombre"></b-form-input>
			</b-form-group>
			<b-form-group
			label="Correo">
				<b-form-input
				v-model="form.email"
				id="email"
				placeholder="Ingrese su correo"></b-form-input>
			</b-form-group>
			<b-form-group
			label="Telefono">
				<b-form-input
				v-model="form.phone"
				placeholder="Ingrese su telefono"></b-form-input>
			</b-form-group>
			<b-form-group
			label="Mensaje">
				<b-form-textarea
				:rows="5"
				v-model="form.message"
				placeholder="Ingrese su mensaje"></b-form-textarea>
			</b-form-group>
			<b-button
			@click="sendMessage"
			block 
			variant="success">
				<btn-loader
				:loader="loading"
				text="Enviar mensaje"></btn-loader>
			</b-button>
		</b-col>
	</b-row>
</template>
<script>
export default {
	components: {
		BtnLoader: () => import('@/components/common/BtnLoader')
	},
	data() {
		return {
			form: {
				name: '',
				email: '',
				phone: '',
				message: '',
			},
			loading: false,
		}
	},
	methods: {
		sendMessage() {
			this.loading = true 
			if (this.check()) {
				this.$api.post('mail-to-commerce', {
					...this.form,
					commerce_id: process.env.VUE_APP_COMMERCE_ID
				})
				.then(res => {
					this.loading = false 
					this.$toast.success('Mensaje enviado')
				})
				.catch(err => {
					console.log(err)
					this.loading = false 
					this.$toast.error('Error al enviar mensaje')
				})
			}
		},
		check() {
			if (this.name == '') {
				this.$toast.error('Ingrese su nombre')
				document.getElementById('name').focus()
				return false
			}
			if (this.email == '') {
				this.$toast.error('Ingrese su correo')
				document.getElementById('email').focus()
				return false
			}
			return true 
		}
	}
}
</script>