<template>
	<div class="send-message">
		<b-form-input
		v-model="text"
		@keyup.enter="sendMessage"
		id="message-text"
		placeholder="Escribe un mensaje"></b-form-input>
		<b-button
		@click="sendMessage"
		variant="success"
		class="m-l-10">
			<btn-loader
			:loader="loading"
			icon="send-o"></btn-loader>
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
.send-message
	width: 100%
	height: 60px
	display: flex
	align-items: center
	padding: 0 .7em
</style>