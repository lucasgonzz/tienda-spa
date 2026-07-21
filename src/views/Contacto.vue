<template>
	<div class="contacto-page view-p-t">
		<b-row class="contacto-page__hero justify-content-center">
			<b-col
			cols="12"
			lg="10"
			xl="9">
				<p class="contacto-page__eyebrow">
					Estamos para ayudarte
				</p>
				<h1 class="contacto-page__title">
					Contacto
				</h1>
				<p
				v-if="commerce.email"
				class="contacto-page__mail-line">
					<a
					class="contacto-page__mail-link"
					:href="'mailto:' + commerce.email">
						<i class="bi bi-envelope"></i>
						{{ commerce.email }}
					</a>
				</p>
			</b-col>
		</b-row>

		<!-- Mensaje de contacto formateado (HTML enriquecido cargado por el dueño del comercio), mismo criterio visual que Quienes somos -->
		<b-row
		v-if="commerce.online_configuration.mensaje_contacto"
		class="contacto-page__mensaje justify-content-center">
			<b-col
			cols="12"
			lg="10"
			xl="9">
				<article class="contacto-page__card contacto-page__card--mensaje">
					<div
					class="contacto-page__prose"
					v-html="commerce.online_configuration.mensaje_contacto"></div>
				</article>
			</b-col>
		</b-row>

		<b-row class="contacto-page__grid justify-content-center">
			<b-col
			cols="12"
			lg="7"
			xl="6">
				<div class="contacto-page__card contacto-page__card--form">
					<h2 class="contacto-page__card-title">
						Enviá un mensaje
					</h2>
					<p class="contacto-page__card-sub">
						Completá el formulario y te respondemos a la brevedad por correo.
					</p>
					<b-form-group label="Nombre">
						<b-form-input
						v-model="form.name"
						id="contacto-name"
						placeholder="Tu nombre"
						autocomplete="name"></b-form-input>
					</b-form-group>
					<b-form-group label="Correo electrónico">
						<b-form-input
						v-model="form.email"
						id="contacto-email"
						type="email"
						placeholder="tu@correo.com"
						autocomplete="email"></b-form-input>
					</b-form-group>
					<b-form-group label="Teléfono">
						<b-form-input
						v-model="form.phone"
						id="contacto-phone"
						placeholder="Código de área y número"
						autocomplete="tel"></b-form-input>
					</b-form-group>
					<b-form-group label="Mensaje">
						<b-form-textarea
						v-model="form.message"
						id="contacto-message"
						:rows="5"
						placeholder="Escribí tu consulta o comentario"></b-form-textarea>
					</b-form-group>
					<b-button
					@click="sendMessage"
					block
					variant="primary"
					class="contacto-page__submit">
						<btn-loader
						:loader="loading"
						text="Enviar mensaje"></btn-loader>
					</b-button>
				</div>
			</b-col>

			<b-col
			cols="12"
			lg="5"
			xl="4">
				<div
				v-if="has_whatsapp"
				class="contacto-page__card contacto-page__card--whatsapp">
					<h2 class="contacto-page__card-title">
						WhatsApp
					</h2>
					<p class="contacto-page__card-sub">
						Preferís escribirnos por chat? Hacé clic y abrí una conversación con el negocio.
					</p>
					<b-button
					:href="whatsapp_url"
					target="_blank"
					rel="noopener noreferrer"
					block
					class="contacto-page__btn-whatsapp">
						<i class="bi bi-whatsapp"></i>
					</b-button>
					<p class="contacto-page__hint">
						{{ commerce.phone }}
					</p>
				</div>

				<div
				v-if="has_social"
				class="contacto-page__card contacto-page__card--social">
					<h2 class="contacto-page__card-title">
						Redes sociales
					</h2>
					<p class="contacto-page__card-sub">
						Seguinos y enterate de novedades y promociones.
					</p>
					<div class="contacto-page__social-row">
						<a
						v-if="commerce.online_configuration.instagram"
						class="contacto-page__social-btn contacto-page__social-btn--ig"
						:href="commerce.online_configuration.instagram"
						target="_blank"
						rel="noopener noreferrer">
							<i
							class="bi bi-instagram contacto-page__social-icon"
							aria-hidden="true"></i>
							<!-- <span>Instagram</span> -->
						</a>
						<a
						v-if="commerce.online_configuration.facebook"
						class="contacto-page__social-btn contacto-page__social-btn--fb"
						:href="commerce.online_configuration.facebook"
						target="_blank"
						rel="noopener noreferrer">
							<i
							class="bi bi-facebook contacto-page__social-icon"
							aria-hidden="true"></i>
							<!-- <span>Facebook</span> -->
						</a>
					</div>
				</div>
			</b-col>
		</b-row>
	</div>
</template>

<script>
export default {
	components: {
		BtnLoader: () => import('@/components/common/BtnLoader'),
	},
	data() {
		return {
			// Datos del formulario de contacto por correo (mail-to-commerce)
			form: {
				name: '',
				email: '',
				phone: '',
				message: '',
			},
			// Indica envío en curso al backend
			loading: false,
		}
	},
	computed: {
		/**
		 * URL de WhatsApp Web/API con el teléfono del comercio (mismo criterio que el resto de la tienda).
		 * @returns {string}
		 */
		whatsapp_url() {
			return 'https://api.whatsapp.com/send?phone=' + this.commerce.phone
		},
		/**
		 * Muestra bloque WhatsApp solo si el comercio tiene teléfono cargado.
		 * @returns {boolean}
		 */
		has_whatsapp() {
			return Boolean(this.commerce && this.commerce.phone)
		},
		/**
		 * Muestra sección de redes si hay al menos un enlace configurado.
		 * @returns {boolean}
		 */
		has_social() {
			if (!this.commerce || !this.commerce.online_configuration) {
				return false
			}
			const conf = this.commerce.online_configuration
			return Boolean(conf.instagram || conf.facebook)
		},
	},
	methods: {
		/**
		 * Envía el formulario al endpoint existente mail-to-commerce con commerce_id del entorno.
		 * Mantiene el flujo actual de la tienda (no usa el chat messages).
		 */
		sendMessage() {
			if (!this.check()) {
				return
			}
			this.loading = true
			this.$api.post('mail-to-commerce', {
				...this.form,
				commerce_id: process.env.VUE_APP_COMMERCE_ID,
			})
				.then(() => {
					this.loading = false
					this.$toast.success('Mensaje enviado')
					this.clear_form()
				})
				.catch((err) => {
					console.log(err)
					this.loading = false
					this.$toast.error('Error al enviar mensaje')
				})
		},
		/**
		 * Valida campos obligatorios y formato de correo antes del POST.
		 * @returns {boolean} true si el envío puede continuar
		 */
		check() {
			if (!this.form.name || String(this.form.name).trim() === '') {
				this.$toast.error('Ingresá tu nombre')
				this.focus_field('contacto-name')
				return false
			}
			if (!this.form.email || String(this.form.email).trim() === '') {
				this.$toast.error('Ingresá tu correo')
				this.focus_field('contacto-email')
				return false
			}
			if (!this.isEmail(this.form.email)) {
				this.$toast.error('Ingresá un correo válido')
				this.focus_field('contacto-email')
				return false
			}
			if (!this.form.phone || String(this.form.phone).trim() === '') {
				this.$toast.error('Ingresá tu teléfono')
				this.focus_field('contacto-phone')
				return false
			}
			if (!this.form.message || String(this.form.message).trim() === '') {
				this.$toast.error('Ingresá el mensaje')
				this.focus_field('contacto-message')
				return false
			}
			return true
		},
		/**
		 * Enfoca un input por id si existe en el DOM.
		 * @param {string} element_id
		 */
		focus_field(element_id) {
			const el = document.getElementById(element_id)
			if (el) {
				el.focus()
			}
		},
		/**
		 * Limpia el formulario tras un envío exitoso.
		 */
		clear_form() {
			this.form.name = ''
			this.form.email = ''
			this.form.phone = ''
			this.form.message = ''
		},
	},
}
</script>

<style lang="sass" scoped>
/*
 * Página de contacto: tipografía clara, tarjetas con sombra suave y acentos del tema (--secondary-color).
 * Indentación con espacios: sass indentado no acepta tabuladores.
 */
.contacto-page
  max-width: 1200px
  margin-left: auto
  margin-right: auto
  padding-bottom: 2.5rem

.contacto-page__hero
  margin-bottom: 1.75rem
  text-align: center
  @media (min-width: 992px)
    text-align: left

.contacto-page__eyebrow
  font-size: 0.8rem
  text-transform: uppercase
  letter-spacing: 0.12em
  color: var(--secondary-color)
  font-weight: 600
  margin-bottom: 0.35rem

.contacto-page__title
  font-size: 1.85rem
  font-weight: 700
  margin-bottom: 0.75rem
  color: #1a1a1a

.contacto-page__mail-line
  margin-top: 1rem
  margin-bottom: 0

.contacto-page__mail-link
  display: inline-flex
  align-items: center
  gap: 0.5rem
  color: var(--secondary-color)
  font-weight: 600
  text-decoration: none
  &:hover
    text-decoration: underline
    color: var(--primary-color)

.contacto-page__grid
  align-items: flex-start

.contacto-page__card
  background: #fff
  border-radius: 14px
  padding: 1.5rem 1.35rem
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.07)
  border: 1px solid rgba(0, 0, 0, 0.06)
  margin-bottom: 1.25rem
  @media (min-width: 992px)
    padding: 1.75rem 1.6rem

.contacto-page__card-title
  font-size: 1.2rem
  font-weight: 700
  margin-bottom: 0.35rem
  color: #222

.contacto-page__card-sub
  font-size: 0.92rem
  color: #666
  line-height: 1.45
  margin-bottom: 1.25rem

.contacto-page__submit
  font-weight: 600
  border-radius: 10px
  padding-top: 0.65rem
  padding-bottom: 0.65rem

.contacto-page__mensaje
  margin-bottom: 1.75rem

.contacto-page__card--mensaje
  border-top: 3px solid var(--secondary-color)

// Contenido enriquecido desde el backend (HTML), mismo criterio que .quienes-somos-page__prose
.contacto-page__prose
  font-size: 1rem
  line-height: 1.65
  color: #333
  p
    margin-bottom: 1rem
    &:last-child
      margin-bottom: 0
  h2, h3, h4
    font-weight: 700
    color: #1a1a1a
    margin-top: 1.35rem
    margin-bottom: 0.65rem
    line-height: 1.3
    &:first-child
      margin-top: 0
  h2
    font-size: 1.35rem
  h3
    font-size: 1.15rem
  h4
    font-size: 1.05rem
  ul, ol
    margin: 0 0 1rem
    padding-left: 1.35rem
  li
    margin-bottom: 0.35rem
  a
    color: var(--secondary-color)
    font-weight: 600
    text-decoration: none
    &:hover
      text-decoration: underline
      color: var(--primary-color)
  strong
    font-weight: 700
    color: #222
  img
    max-width: 100%
    height: auto
    border-radius: 10px
    margin: 0.75rem 0
  blockquote
    margin: 1rem 0
    padding: 0.75rem 1rem
    border-left: 4px solid var(--secondary-color)
    background: rgba(0, 0, 0, 0.03)
    color: #444
    font-style: normal

.contacto-page__card--whatsapp
  border-top: 3px solid #25D366

.contacto-page__btn-whatsapp
  background: #25D366 !important
  border: none !important
  color: #fff !important
  font-weight: 600
  border-radius: 10px
  padding-top: 0.65rem
  padding-bottom: 0.65rem
  display: inline-flex
  align-items: center
  justify-content: center
  gap: 0.5rem
  &:hover
    background: #1ebe5d !important
    color: #fff !important

.contacto-page__hint
  font-size: 0.85rem
  color: #888
  text-align: center
  margin-top: 0.75rem
  margin-bottom: 0

.contacto-page__card--social
  border-top: 3px solid var(--secondary-color)

.contacto-page__social-row
  display: flex
  flex-direction: column
  gap: 0.65rem

.contacto-page__social-icon
  font-size: 1.35rem
  line-height: 1

.contacto-page__social-btn
  display: flex
  align-items: center
  justify-content: center
  gap: 0.55rem
  padding: 0.7rem 1rem
  border-radius: 10px
  font-weight: 600
  text-decoration: none
  color: #fff
  transition: transform 0.15s ease, box-shadow 0.15s ease
  &:hover
    color: #fff
    text-decoration: none
    transform: translateY(-1px)
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12)

.contacto-page__social-btn--ig
  background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)

.contacto-page__social-btn--fb
  background: #1877f2
</style>
