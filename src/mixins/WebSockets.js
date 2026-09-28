import messages from '@/mixins/messages'
import { conectar_echo, desconectar_echo } from '@/helpers/echo'

/*
 * Tiempo real del comprador (lo usa solo App.vue).
 *
 * Desde el 28/9/2026 la conexión con Pusher existe SOLO mientras hay un comprador logueado
 * (ver src/helpers/echo.js): se abre en listenChannels() y se cierra cuando la sesión se cae.
 * Los canales y lo que hace cada uno son los de siempre.
 */
export default {
	mixins: [messages],
	watch: {
		/*
		 * Una pestaña sin sesión no puede quedar conectada. Se mira el flag y no la acción
		 * auth/logout porque la sesión se cae por más de un camino: el logout del menú, el del
		 * comprador invitado después de comprar (logoutGuestAfterOrder en mixins/cart.js, que
		 * commitea directo) y el auth/me que falla.
		 */
		authenticated(valor) {
			if (!valor) {
				this.dejar_de_escuchar()
			}
		},
	},
	created() {
		/*
		 * Qué está suscripto y con qué conexión. A propósito NO reactivo: Vue no tiene por qué
		 * observar por dentro la instancia de Echo/Pusher.
		 */
		this.ws_echo = null
		this.ws_comprador_id = null
	},
	methods: {
		/**
		 * Conecta (si hace falta) y suscribe los canales del comprador logueado. Sin comprador no
		 * hace nada: el visitante anónimo no abre conexión ni descarga las librerías.
		 *
		 * Se puede llamar las veces que sea (callAuthMethods corre en cada login): si ya está
		 * suscripto el mismo comprador en la misma conexión, no vuelve a suscribir.
		 *
		 * No devuelve la promesa a propósito: callAuthMethods (App.vue) la espera con await, y el
		 * carrito que se pide después no tiene por qué esperar la descarga del chunk de Pusher.
		 *
		 * @returns {void}
		 */
		listenChannels() {
			if (!this.authenticated || !this.user || !this.user.id) {
				return
			}
			let self = this
			conectar_echo()
			.then(echo => {
				self.suscribir_canales(echo)
			})
			.catch(err => {
				console.log(err)
			})
		},
		/**
		 * @param {Object|null} echo la instancia que devolvió conectar_echo()
		 * @returns {void}
		 */
		suscribir_canales(echo) {
			/* Sin key en el build, el chunk que no bajó o la sesión cerrada mientras bajaba. */
			if (!echo) {
				return
			}

			/* Mientras bajaba el chunk la sesión pudo cerrarse o cambiar: manda la de AHORA. */
			if (!this.authenticated || !this.user || !this.user.id) {
				return
			}
			let comprador_id = this.user.id

			if (echo === this.ws_echo && comprador_id === this.ws_comprador_id) {
				/* Ya suscripto: un segundo listener duplicaría cada pedido y cada mensaje. */
				return
			}

			if (echo === this.ws_echo && this.ws_comprador_id !== null) {
				/* Cambió el comprador sin que se cortara la conexión: fuera los canales del anterior. */
				this.dejar_canales(echo, this.ws_comprador_id)
			}

			if (echo !== this.ws_echo) {
				this.escuchar_reconexion(echo)
			}

			this.ws_echo = echo
			this.ws_comprador_id = comprador_id

			let self = this

			echo.channel('order.'+comprador_id)
			.notification((notification) => {
				self.$store.commit('orders/setOrder', notification.order)
				// self.$store.dispatch('notifications/getUnreadNotifications')
				if (self.isOrderDelivered(notification)) {
					self.$store.dispatch('orders/getCurrentOrder')
					self.$store.dispatch('orders/getOrders')
				}
			})
			echo.channel('message.from_commerce.'+comprador_id)
			.notification((notification) => {
				self.$store.commit('messages/addMessage', notification.message)
				self.$store.commit('messages/setMessagesNotRead')
				console.log(notification)
				if (self.isOrderDelivered(notification.message)) {
					console.log('es order delivered')
					self.$store.dispatch('orders/getCurrentOrder')
					self.$store.dispatch('orders/getOrders')
				}
				if (self.isCartAmountUpdated(notification.message)) {
					console.log('es cart amount updated')
					self.$store.dispatch('cart/getLastCart')
				}
				self.checkIfIsMessagesView()
			})
			echo.channel('question.'+comprador_id)
			.notification(() => {
				self.$store.dispatch('notifications/getUnreadNotifications')
			})
			echo.channel('payment.'+comprador_id)
			.notification(() => {
				self.$store.dispatch('notifications/getUnreadNotifications')
			})
		},
		/**
		 * @param {Object} echo
		 * @param {number} comprador_id
		 * @returns {void}
		 */
		dejar_canales(echo, comprador_id) {
			echo.leave('order.'+comprador_id)
			echo.leave('message.from_commerce.'+comprador_id)
			echo.leave('question.'+comprador_id)
			echo.leave('payment.'+comprador_id)
		},
		/**
		 * Pusher no reenvía lo que se emitió mientras la conexión estaba caída (celular que se
		 * durmió, wifi que se cortó). Cada vez que vuelve a conectar —no la primera— se piden de
		 * nuevo los mensajes, que es lo que el comprador ve.
		 *
		 * @param {Object} echo
		 * @returns {void}
		 */
		escuchar_reconexion(echo) {
			let self = this
			let conexion = echo.connector.pusher.connection
			let ya_conecto = conexion.state === 'connected'
			conexion.bind('connected', () => {
				if (echo !== self.ws_echo) {
					/* Una conexión que ya se descartó. */
					return
				}
				if (!ya_conecto) {
					ya_conecto = true
					return
				}
				if (self.authenticated) {
					self.$store.dispatch('messages/getMessages')
				}
			})
		},
		/**
		 * Cierra la conexión y olvida lo suscripto. Con la conexión se van sus canales.
		 *
		 * @returns {void}
		 */
		dejar_de_escuchar() {
			this.ws_echo = null
			this.ws_comprador_id = null
			desconectar_echo()
		},
		checkIfIsMessagesView() {
			if (this.$route.name == 'Messages') {
				this.$store.dispatch('messages/setMessagesRead')
				this.$store.commit('messages/setMessagesRead')
				this.$store.commit('messages/setMessagesNotRead')
				this.scrollBottom('messages-list')
			}
		}
	}
}
