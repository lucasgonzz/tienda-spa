<template>
	<b-row
	v-if="selected_option == 'escribinos'">
		<b-col
		lg="6">
			<b-card
			class="shadow">
				<b-form-group
				label="Escribinos tu mensaje, te responderemos a la brevedad:">
					<b-form-textarea
					v-model="message"
					placeholder="Contanos sobre tu problema o pregunta..."></b-form-textarea>
				</b-form-group>
				<b-form-group>
					<b-button
					block
					@click="sendMessage"
					variant="success">
						<btn-loader
						text="Enviar"
						:loader="loading"></btn-loader>
					</b-button>
				</b-form-group>
				<back></back>
			</b-card>
		</b-col>
	</b-row>
</template>
<script>
import BtnLoader from '@/components/common/BtnLoader'
import Back from '@/components/help/components/Back'
export default {
	components: {
		BtnLoader,
		Back,
	},
	data() {
		return {
			loading: false,
		}
	},
	computed: {
		selected_option() {
			return this.$store.state.help.selected_option
		},
		message: {
			get() {
				return this.$store.state.help.message
			},
			set(value) {
				this.$store.commit('help/setMessage', value)
			}
		},
	},
	methods: {
		sendMessage() {
			if (this.checkAuth()) {
				if (this.check()) {
		 			this.loading = true
					this.$api.post('help/message', {
						message: this.message,
						commerce_id: process.env.VUE_APP_COMMERCE_ID
					})
					.then(() => {
						this.loading = false
						this.$toast.success('Mensaje enviado')
                		this.$store.dispatch('messages/getMessages')
						this.$router.push({name: 'Messages'})
						this.clear()
					})
					.catch(err => {
						this.loading = false
						 console.log(err)
						 this.$toast.error('Error el enviar mensaje')
					})
				}
			}
		},
		clear() {
			this.$store.commit('help/setMessage', '')
			this.$store.commit('help/setSelectedOption', '')
		},
		check() {
			if (this.message == '') {
				this.$toast.error('Escriba su mensaje, por favor')
				return false
			}
			return true
		}
	}
}
</script>