<template>
	<div
	id="messages-list">
		<div
		v-if="messages.length"
		id="conversation-messages">
			<div 
			v-for="message in messages"
			:key="message.id || message.created_at || message.text"
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
					{{ format_message_datetime(message.created_at) }}
				</p>
			</div>
		</div>
		<div
		class="text-with-icon"
		v-else>
            <i class="bi bi-chat-dots"></i>
			No hay mensajes
		</div>
	</div>
</template>
<script>
import moment from 'moment'
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
		/**
		 * Define la clase visual de la burbuja según emisor.
		 * from_buyer=true representa mensaje entrante.
		 *
		 * @param {Object} message Mensaje de conversación.
		 * @returns {string}
		 */
		getClassMessage(message) {
			return message.from_buyer ? 'incoming-message' : 'outgoing-message'
		},
		/**
		 * Formatea fecha y hora siguiendo el estándar visual de soporte.
		 *
		 * @param {string} created_at Fecha de creación del mensaje.
		 * @returns {string}
		 */
		format_message_datetime(created_at) {
			return moment(created_at).format('DD/MM/YYYY HH:mm')
		},
	}
}
</script>
<style lang="sass">
@import '@/sass/_custom'
#messages-list
	height: calc(100% - 60px)
	overflow-y: scroll
	padding: 12px
	background: #f7f9fb
	border-radius: 10px
#conversation-messages
	display: flex
	flex-direction: column
	gap: 8px
.incoming-message
	align-self: flex-start
	color: #111827
.outgoing-message
	align-self: flex-end
	color: #111827
.message
	border-radius: 10px
	padding: 8px 10px
	margin-bottom: 0
	background: #FFF
	border: 1px solid #ececec
	max-width: 80%
	@media screen and (max-width: 375px)
		width: auto
	@media screen and (min-width: 375px)
		width: auto
	text-align: left
	.text
		white-space: pre-wrap
	.since
		font-size: 11px
		color: #6b7280
		text-align: right
		margin-top: 4px
		line-height: 1.2
.outgoing-message.message
	background: #dcf8c6
	.since
		color: #6b7280
.incoming-message.message
	background: #ffffff
	.since
		color: #6b7280
	p 
		margin: 0
</style>