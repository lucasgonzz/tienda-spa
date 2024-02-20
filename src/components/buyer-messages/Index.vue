<template>
<div 
id="buyer-messages">
	
	<div class="cont-foto-perfil">
		<img 
		class="foto-perfil c-p"
		@click="toggle_chat"
		src="@/assets/lucas.jpg">

		<div 
		v-if="mensajes_no_leidos > 0"
		class="mensajes-no-leidos">
			{{ mensajes_no_leidos }}
		</div>
	</div>

	<div class="header">
		Lucas Gonzalez

		<div 
		@click="esconder_chat"
		class="esconder-chat">
			<i 
			class="icon-right"></i>
		</div>
	</div>

	<div 
	id="body-buyer-messages"
	class="body">
		<div 
		v-for="message in messages"
		:class="message.from_buyer ? 'from-buyer' : ''"
		class="message">
			{{ message.text }}
		</div>

		<div 
		v-if="escribiendo"
		class="escribiendo">Escribiendo...</div>
	</div>

	<div class="footer"> 
		<div 
		v-if="this.last_message && this.last_message.buyer_message_default_responses.length"
		class="message-options">
			<div 
			v-for="default_message in this.last_message.buyer_message_default_responses"
			@click="sendDefaultMessage(default_message)"
			class="message-option">
				{{ default_message.text }}
			</div>
		</div>

		<div class="send-message">
			<input 
			type="text" 
			v-model="message_to_send"
			placeholder="Escribir tu mensaje...">
			<div 
			@click="enviar_mensaje"
			class="btn-enviar">
				<b-spinner
				v-if="enviando"
				size="sm"></b-spinner>
				<span
				v-else>
					Enviar
				</span>
			</div>
		</div>
	</div>
</div>
</template>
<script>
export default {
	created() {
		// this.show()
	},
	watch: {
		authenticated() {
			// this.show()
		},
	},
	data() {
		return {
			messages: [],
			message_to_send: '',
			escribiendo: false,
			enviando: false,
			chat_visible: false,
			mensajes_no_leidos: 0,
		}
	},
	computed: {
		last_message() {
			if (this.messages.length) {
				return this.messages[this.messages.length-1]
			}
			return null
		}
	},
	methods: {
		show() {
			if (this.user) {

				this.getMessages()
				.then(() => {
					if (!this.messages.length) {
						console.log('no tenia mensajes')
						this.mostrar_chat()
						setTimeout(() => {
							this.add_saludo()
						}, 2000)
					}
				})
			}
		},
		toggle_chat() {
			if (this.chat_visible) {
				this.esconder_chat()
			} else {
				this.mostrar_chat()
			}
		},
		mostrar_chat() {
			document.getElementById('buyer-messages').classList.add('buyer-messages-active')
			this.chat_visible = true
			this.mensajes_no_leidos = 0
			console.log('mostrar_chat')
		},
		esconder_chat() {
			document.getElementById('buyer-messages').classList.remove('buyer-messages-active')
			this.chat_visible = false
			console.log('esconder_chat')
		},
		add_saludo() {
			this.escribiendo = true
			setTimeout(() => {
				this.messages.push({
					text: 'Hola '+this.user.name.split(' ')[0],
					from_buyer: false,
					buyer_message_default_responses: [],
				})

				setTimeout(() => {

					this.escribiendo = false
					let message = {
						text: 'Me llamo lucas y queria comentarte algo importante sobre tu negocio, tendras un momento?',
						from_buyer: false,
						buyer_message_default_responses: [
							{
								text: 'Me interesa',
								from_buyer: 1,	
							},
							{
								text: 'Prefiero dejarlo pasar',
								from_buyer: 1,	
							},
						],
					}
					this.messages.push(message)

					this.guardar_mensajes()

				}, 5000)
			}, 3000)
		},
		getMessages() {
			return this.$api.get('buyer-message')
			.then(res => {
				this.messages = res.data.models
				this.mensajes_no_leidos = this.messages.length
			})
			.catch(err => {
				console.log(err)
			})
		},
		sendDefaultMessage(message) {
			this.message_to_send = message.text
			this.enviar_mensaje()
		},
		enviar_mensaje() {
			this.messages.push({
				text: this.message_to_send,
				from_buyer: 1,
				buyer_message_default_responses: [],
			}) 
			this.guardar_mensajes()
			.then(() => {
				let mensajes_de_lucas = this.messages.filter(message => {
					return !message.from_buyer
				})
				console.log('mensajes_de_lucas')
				console.log(mensajes_de_lucas)
				if (mensajes_de_lucas.length == 2) {
					this.add_mensajes_sobre_servicio()
				}
			}) 
		},
		add_mensajes_sobre_servicio() {
			this.escribiendo = true 

			setTimeout(() => {
				let message = {
					text: 'Si sos cliente de '+this.commerce.company_name+' y revendes sus articulos, podemos automatizarte todos los costos de todos los artículos de '+this.commerce.company_name+' (los que ya le hayas comprado, y los que todavía no)',
					from_buyer: false,
					buyer_message_default_responses: [],
				}
				this.messages.push(message)
				this.body_scroll_bottom()

				setTimeout(() => {
					message = {
						text: 'Para que a esos costos, podamos aplicarles el o los márgenes de ganancia que quieras, para que tengas el o los precios finales que tus clientes merecen',
						from_buyer: false,
						buyer_message_default_responses: [],
					}
					this.messages.push(message)
					this.body_scroll_bottom()


					setTimeout(() => {
						message = {
							text: 'Decime '+this.user.name.split(' ')[0]+', esto te ayudaría a ahorrarte ese tiempo y esfuerzo, con la posibilidad además de entregarles a tus clientes una pagina web 100% automatizada (prácticamente funciona sin que hagas nada a un 90%).',
							from_buyer: false,
							buyer_message_default_responses: [
								{
									text: 'Eso estaria buenisimo, me interesa',
									from_buyer: 1,	
								},
								{
									text: 'Prefiero dejarlo pasar',
									from_buyer: 1,	
								},
							],
						}
						this.messages.push(message)

						this.body_scroll_bottom()

						this.escribiendo = true 

						this.guardar_mensajes()

					}, 10000)

				}, 10000)

				this.guardar_mensajes()
			}, 6000)
		},
		body_scroll_bottom() {

			let body = document.getElementById('body-buyer-messages')
			console.log('body')
			console.log(body)
			if (body) {
				setTimeout(() => {
					body.scrollTop = body.scrollHeight;
				}, 500)
			} 
		},
		guardar_mensajes() {
			this.enviando = true 
			return this.$api.post('buyer-message', {
				messages: this.messages
			})
			.then(() => {
				this.enviando = false 
			})
			.catch(err => {
				this.enviando = false 
				console.log(err)
			})
		}
	}
}
</script>
<style lang="sass">
@import '@/sass/_custom'
#buyer-messages
	width: 400px
	height: 600px

	position: fixed 
	right: -600px
	bottom: 100px
	z-index: 1000
	transition: all 1s
	// transform: scale(.1)

	box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px

	.cont-foto-perfil
		position: absolute
		left: -55px
		top: -35px
		z-index: 2000

		.foto-perfil
			width: 70px
			height: 70px
			border-radius: 50%
			border: 3px solid #FFF

		.mensajes-no-leidos
			width: 25px
			height: 25px
			background: $red 
			border-radius: 50%
			font-size: 13px
			position: absolute 
			bottom: -5px
			left: -5px
			color: #FFF
			display: flex 
			align-items: center 
			justify-content: center
			font-weight: bold
			animation-iteration-count: infinite
			animation-name: twinkle-1
			animation-duration: 1s



	.header	
		background: darken($green, 15)
		color: #FFF
		border-radius: 8px 8px 0 0 
		padding: 15px
		font-size: 1.2em
		font-weight: bold
		position: relative

	.body 
		background: #EAEAEA
		height: 80%
		// height: 400px
		padding: 15px
		position: relative
		display: flex 
		flex-direction: column 
		justify-content: flex-start
		overflow-y: auto
		padding-bottom: 150px

		.message
			background: #FFF
			border-radius: 8px
			padding: 5px 10px
			max-width: 70%
			width: auto
			align-self: flex-start
			font-size: 1.2em
			margin-bottom: 5px

		.from-buyer 
			background: darken($green, 15)
			align-self: flex-end
			color: #FFF


		.escribiendo
			background: #FFF
			color: #333
			position: fixed
			bottom: 10px
			left: 10px
			width: 160px
			height: 30px
			animation-iteration-count: infinite
			animation-name: twinkle-1
			animation-duration: 1s
			box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px
			border-radius: 12px
			font-size: 1em
			font-weight: bold



		@keyframes twinkle-1 
			50% 
				transform: scale(0.9)
				opacity: 0.5
	


	.esconder-chat
		position: absolute 
		right: 10px
		top: 14px
		background: #DFDFDF
		border-radius: 50%
		width: 30px
		height: 30px
		box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px
		cursor: pointer
		z-index: 2000
		color: #333
		display: flex 
		align-items: center
		justify-content: center
		i 	
			&::before
				margin: 0
				padding: 0


	.footer 
		background: #FFF
		border-radius: 0 0 8px 8px
		// padding: 10px
		position: relative

		.message-options
			position: absolute
			bottom: 100%
			left: 0

			padding: 15px

			display: flex 
			flex-direction: column
			justify-content: center
			align-items: center

			width: 100%
			background: rgb(0,0,0)
			background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%, rgba(0,0,0,0.6) 100%)

			.message-option	
				background: lighten($green, 15)
				color: #FFF
				border-radius: 8px
				padding: 5px 8px
				margin-bottom: 7px
				width: 50%
				cursor: pointer
				border: 1px solid $green

				&:hover
					background: lighten($green, 5)

		.send-message
			display: flex 
			flex-direction: row 
			justify-content: space-between
			align-items: center
			width: 100%

			input 	
				border-radius: 5px 
				background: rgba(0,0,0,.1) 	
				width: calc(100% - 90px)
				border: none
				padding: 6px 10px

			.btn-enviar
				width: 80px
				border-radius: 8px 
				background: $green 
				display: flex
				flex-direction: row 
				justify-content: center 
				align-items: center 
				height: 36px
				color: #FFF
				border: 1px solid darken($green, 10)
				cursor: pointer
				&:hover
					background: lighten($green, 5)

				.spinner-border
					width: 20px
					height: 20px
					color: #333 !important


.buyer-messages-active
	right: 20px !important
	transform: scale(1) !important

</style>