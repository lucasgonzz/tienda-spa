<template>
	<div
	id="messages-list">
		<div
		v-if="messages.length"
		id="conversation-messages">
			<div 
			v-for="message in messages"
			class="message s"
			:class="getClassMessage(message)">
				<p class="text">
					{{ message.text }}
				</p>
				<article-card 
				class="m-t-10"
				shadow="shadow-1"
				v-if="hasArticle(message)"
				:article="message.article"></article-card>
				<p class="since">
					{{ since(message.created_at) }}
				</p>
			</div>
		</div>
		<div
		class="text-with-icon"
		v-else>
            <i class="icon-comment"></i>
			No hay mensajes
		</div>
	</div>
</template>
<script>
import messages from '@/mixins/messages'
import ArticleCard from '@/components/common/ArticleCard'
export default {
	mixins: [messages],
	components: {
		ArticleCard,
	},
	computed: {
		messages() {
			return this.$store.state.messages.messages
		},
	},
	methods: {
		getClassMessage(message) {
			return message.from_buyer ? 'buyer-message bg-success' : 'commerce-message'
		}
	}
}
</script>
<style lang="sass">
// @import '@/sass/_custom'
// $buyer_color: ''
// $commerce_color: ''
// @if ($theme == dark) 
// 	$buyer_color: #000
// 	$commerce_color: #000
// @else if ($theme == ligth) 
// 	$buyer_color: #FFF
// 	$commerce_color: #000


#messages-list
	// height: calc(100vh - 50px - 15px - 50px - 50px)
	height: calc(100% - 60px) 
	overflow-y: scroll
	padding: 0 .5em
#conversation-messages
	display: flex
	flex-direction: column
	padding: 1em .2em
.buyer-message
	align-self: flex-end
	.text
		color: #000
	.since
		color: #000
.commerce-message
	.text
		color: #000 
	.since
		color: #000 
.message
	border-radius: .5em
	padding: .5em
	margin-bottom: 1em
	background: #FFF
	&:last-child
		margin-bottom: 0
	@media screen and (max-width: 375px)
		width: 200px
	@media screen and (min-width: 375px)
		width: 300px
	text-align: left
	.since
		font-size: .7em
		text-align: right
	p 
		margin: 0
</style>