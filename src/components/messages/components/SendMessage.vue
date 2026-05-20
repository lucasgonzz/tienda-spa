<template>
	<div class="send-message">
		<b-form-input
		v-model="text"
		@keyup.enter="sendMessage"
		id="message-text"
		placeholder="Escribe un mensaje"></b-form-input>
		<b-button
		@click="sendMessage"
		variant="primary"
		class="m-l-10">
			<btn-loader
			:loader="loading"
			icon="paper-plane"></btn-loader>
		</b-button>
	</div>
</template>
<script>
import BtnLoader from '@/components/common/BtnLoader'
export default {
	components: {
		BtnLoader,
	},
	data() {
		return {
			text: '',
			loading: false,
		}
	},
	methods: {
		sendMessage() {
			if (this.check()) {
				this.loading = true
				this.$api.post('messages', {
					text: this.text,
					commerce_id: process.env.VUE_APP_COMMERCE_ID,
				})
				.then(res => {
					this.$store.commit('messages/addMessage', res.data.message)
					this.loading = false
					this.clear()
					this.scrollBottom('messages-list')
				})
				.catch(err => {
					console.log(err)
					this.loading = false
				})
			}
		},
		check() {
			if (this.text == '') {
				return false
			}
			return true
		},
		clear() {
			this.text = ''
		}
	}
}
</script>
<style lang="sass">
/*
 * El tema de la tienda mapea .btn-primary al color secundario del comercio (--secondary-color).
 * El input refuerza el mismo acento en el estado :focus.
 * Indentación con espacios: sass indentado no acepta tabuladores.
 */
.send-message
  width: 100%
  height: 60px
  display: flex
  align-items: center
  padding: 0 .7em
  .form-control:focus
    border-color: var(--secondary-color)
    box-shadow: 0 0 0 0.2rem color-mix(in srgb, var(--secondary-color) 25%, transparent)
</style>