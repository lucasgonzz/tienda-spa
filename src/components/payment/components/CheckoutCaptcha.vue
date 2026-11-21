<template>
	<section aria-label="Verificación de compra" class="mb-3">
		<p v-if="mensaje" role="status" aria-live="polite">{{ mensaje }}</p>
		<div ref="widget"></div>
		<b-button v-if="error" class="checkout-captcha__reintentar" variant="outline-secondary" @click="reintentar">
			Reintentar verificación
		</b-button>
	</section>
</template>
<script>
import { contexto_captcha, limpiar_token_captcha, recibir_token_captcha } from '@/store/cart'

// Marca interna (comparada por identidad) de "API anterior sin endpoint": un cuerpo del servidor no puede imitarla.
const API_ANTERIOR = Object.freeze({})

export default {
	data() {
		return { mensaje: 'Preparando verificación…', error: false }
	},
	created() {
		// Recursos no reactivos y comprobantes separados de los datos persistibles.
		this.ciclo = 0
		this.widgetId = null
		this.configuracion = null
		this.script = null
		this.temporizador = null
		this.contexto = contexto_captcha(this.$store.state)
		this.revision = this.$store.state.cart.captcha_revision
		this.desuscribir = this.$store.subscribe(() => {
			const contexto = contexto_captcha(this.$store.state)
			const revision = this.$store.state.cart.captcha_revision
			if (contexto !== this.contexto) {
				this.contexto = contexto
				this.revision = revision
				this.configuracion = null
				this.iniciar()
			} else if (revision !== this.revision) {
				this.revision = revision
				this.iniciar()
			}
		})
	},
	mounted() {
		this.iniciar()
	},
	beforeDestroy() {
		this.desuscribir()
		this.limpiar()
	},
	methods: {
		limpiar() {
			this.ciclo++
			this.$emit('ready', false)
			limpiar_token_captcha(this.$store.state)
			clearTimeout(this.temporizador)
			if (this.script) {
				this.script.onload = null
				this.script.onerror = null
				if (this.script.parentNode) this.script.parentNode.removeChild(this.script)
				this.script = null
			}
			if (this.widgetId !== null && window.turnstile) {
				try { window.turnstile.remove(this.widgetId) } catch (e) { /* Ya eliminado. */ }
			}
			this.widgetId = null
		},
		vigente(ciclo, contexto) {
			return ciclo === this.ciclo && contexto === contexto_captcha(this.$store.state) && !this._isDestroyed
		},
		fallar() {
			this.limpiar()
			this.error = true
			this.mensaje = 'No pudimos verificar la compra. Tu formulario sigue guardado; probá de nuevo.'
		},
		reintentar() {
			this.iniciar()
		},
		/**
		 * Indica si un rechazo de la consulta de configuración es el de una tienda-api ANTERIOR,
		 * que todavía no tiene GET buyer/checkout-captcha (ruta inexistente => 404).
		 * Se exige respuesta HTTP 404 y que el cuerpo NO traiga el campo `captcha`: la API nueva
		 * siempre responde esa clave y nunca 404 en esta ruta. Red caída, timeout, 401/403/419/429,
		 * 5xx o cualquier otro fallo NO cuentan: siguen bloqueando para no dejar el checkout
		 * desprotegido ante un error real (no simplificar a "cualquier error => permitir").
		 * @param {*} err Rechazo de axios (o cualquier valor rechazado).
		 * @returns {boolean}
		 */
		es_api_anterior(err) {
			if (!err || !err.response || err.response.status !== 404) return false
			const data = err.response.data
			return !(data && typeof data === 'object' && 'captcha' in data)
		},
		iniciar() {
			this.limpiar()
			this.error = false
			this.mensaje = 'Preparando verificación…'
			const ciclo = this.ciclo
			const contexto = this.contexto
			let self = this
			// Una consulta por ciclo de sesión. Renovar el widget no vuelve a consultar la API.
			const consulta = this.configuracion ? Promise.resolve(this.configuracion) : this.$api.get('buyer/checkout-captcha')
				.then(function(res) { return res.data && res.data.captcha }, function(err) {
					// API anterior sin el endpoint: la compra sigue como antes, sin token. No se cachea:
					// cada ciclo vuelve a consultar y, si la API ya es nueva, se protege.
					if (self.es_api_anterior(err)) return API_ANTERIOR
					throw err
				})
			consulta.then(function(config) {
				if (!self.vigente(ciclo, contexto)) return
				if (config === API_ANTERIOR) {
					self.mensaje = ''
					self.$emit('ready', true)
					return
				}
				if (!config || config.provider !== 'turnstile') throw new Error('configuracion_invalida')
				self.configuracion = config
				if (config.state === 'disabled' && config.required === false) {
					self.mensaje = ''
					self.$emit('ready', true)
					return
				}
				if (config.state !== 'enabled' || config.required !== true || typeof config.site_key !== 'string' || !config.site_key.trim() || (typeof config.action !== 'string' || !/^[a-zA-Z0-9_-]{1,32}$/.test(config.action))) {
					// Una configuración incompleta nunca equivale a protección apagada.
					self.configuracion = null
					throw new Error('configuracion_incompleta')
				}
				self.cargar_widget(config, ciclo, contexto)
			}).catch(function() {
				if (self.vigente(ciclo, contexto)) self.fallar()
			})
		},
		cargar_widget(config, ciclo, contexto) {
			let self = this
			const renderizar = function() {
				if (!self.vigente(ciclo, contexto)) return
				clearTimeout(self.temporizador)
				try {
					if (!window.turnstile) throw new Error('proveedor_no_disponible')
					self.mensaje = 'Completá la verificación para enviar tu pedido.'
					let recibido = false
					self.widgetId = window.turnstile.render(self.$refs.widget, {
						sitekey: config.site_key, action: config.action, 'response-field': false,
						retry: 'never', 'refresh-expired': 'never',
						callback: function(token) {
							if (!self.vigente(ciclo, contexto) || recibido) return
							recibido = true
							if (!recibir_token_captcha(self.$store.state, contexto, token)) return self.fallar()
							self.mensaje = ''
							self.$emit('ready', true)
						},
						'expired-callback': function() { if (self.vigente(ciclo, contexto)) self.fallar() },
						'error-callback': function() { if (self.vigente(ciclo, contexto)) self.fallar() },
						'timeout-callback': function() { if (self.vigente(ciclo, contexto)) self.fallar() },
					})
				} catch (e) { self.fallar() }
			}
			if (window.turnstile) return renderizar()
			// Sólo se descarga el proveedor cuando la API lo habilitó en este checkout real.
			this.script = document.createElement('script')
			this.script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
			this.script.async = true
			this.script.defer = true
			this.script.onload = renderizar
			this.script.onerror = function() { if (self.vigente(ciclo, contexto)) self.fallar() }
			this.temporizador = setTimeout(function() { if (self.vigente(ciclo, contexto)) self.fallar() }, 15000)
			document.head.appendChild(this.script)
		},
	},
}
</script>
<style lang="sass">
.checkout-captcha__reintentar
	// Objetivo táctil mínimo de 44 px (con size="sm" medía 31 px)
	min-height: 44px
	display: inline-flex
	align-items: center
	justify-content: center
</style>
