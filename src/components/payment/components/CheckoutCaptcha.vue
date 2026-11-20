<template>
	<section aria-label="Verificación de compra" class="mb-3">
		<p v-if="mensaje" role="status" aria-live="polite">{{ mensaje }}</p>
		<div ref="widget"></div>
		<b-button v-if="error" variant="outline-secondary" size="sm" @click="reintentar">
			Reintentar verificación
		</b-button>
	</section>
</template>
<script>
import { contexto_captcha, limpiar_token_captcha, recibir_token_captcha } from '@/store/cart'

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
		iniciar() {
			this.limpiar()
			this.error = false
			this.mensaje = 'Preparando verificación…'
			const ciclo = this.ciclo
			const contexto = this.contexto
			let self = this
			// Una consulta por ciclo de sesión. Renovar el widget no vuelve a consultar la API.
			const consulta = this.configuracion ? Promise.resolve(this.configuracion) : this.$api.get('buyer/checkout-captcha')
				.then(function(res) { return res.data && res.data.captcha })
			consulta.then(function(config) {
				if (!self.vigente(ciclo, contexto)) return
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
