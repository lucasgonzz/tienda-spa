<template>
	<div class="view view-messages">
		<b-row>
			<b-col
			cols="12"
			md="6">
				<chat></chat>
			</b-col>
		</b-row>
	</div>
</template>
<script>
import Chat from '@/components/messages/components/Chat'
export default {
	name: 'Messages',
	components: {
		Chat,
	},
	mounted() {
		this.setTitle('Mensajes')
		this.scrollBottom('messages-list')
		if (!this.is_mobile) {
			document.getElementById('message-text').focus()
		}
		this.$store.dispatch('messages/setMessagesRead')
		this.$store.commit('messages/setMessagesRead')
		this.$store.commit('messages/setMessagesNotRead')
	}
}
</script>
<style lang="sass">
.view-messages
	// margin-top: -15px
	padding-bottom: 0 !important
</style>