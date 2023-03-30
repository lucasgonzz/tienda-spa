<template>
	<b-card
	no-body
	id="chat">
		<messages-list></messages-list>
		<send-message></send-message>
	</b-card>
</template>
<script>
import MessagesList from '@/components/messages/components/MessagesList'
import SendMessage from '@/components/messages/components/SendMessage'
export default {
	name: 'Messages',
	components: {
		MessagesList,
		SendMessage,
	},
}
</script>
<style lang="sass">
$nav_height: 50px
$nav_margin: 15px
$nav_mobile_height: 50px
#chat 
	border: none
	background: none
	@media screen and (max-height: 300px)
		height: calc(100vh - 140px - 15px) 
	@media screen and (min-height: 300px)
		height: calc(100vh - 140px - 15px) 
	@media screen and (max-width: 992px)
		border: none
	@media screen and (min-width: 992px)
		height: calc(100vh - 140px - 30px) 
</style>