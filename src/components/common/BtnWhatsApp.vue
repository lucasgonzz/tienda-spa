<template>
	<div
	v-if="storefront_whatsapp_contacts.length && route_name == 'Home' && !(custom_contacts && contact_section_visible)"
	:class="{ 'btn-whats-app-active': scroll_bottom, 'btn-whats-app-custom': custom_contacts }"
	class="btn-whats-app-group">
		<a
		v-for="contact in storefront_whatsapp_contacts"
		:key="contact.key"
		:href="contact.link"
		:aria-label="contact.name + ' (abre en una pestaña nueva)'"
		target="_blank"
		rel="noopener noreferrer"
		class="btn-whats-app s">
			<i class="bi bi-whatsapp" aria-hidden="true"></i>
			<span v-if="custom_contacts">{{ contact.name }}</span>
		</a>
	</div>
</template>
<script>
export default {
	data() {
		return {
			scroll: 0,
			scroll_bottom: false,
			contact_section_visible: false,
		}
	},
	computed: {
		custom_contacts() {
			return this.storefront_whatsapp_contacts.some(contact => contact.key != 'general')
		},
	},
	mounted() {
		window.addEventListener('scroll', this.trackScroll, { passive: true })
		window.addEventListener('resize', this.updateContactVisibility)
		this.$nextTick(this.updateContactVisibility)
	},
	beforeDestroy() {
		window.removeEventListener('scroll', this.trackScroll)
		window.removeEventListener('resize', this.updateContactVisibility)
	},
	methods: {
		trackScroll() {
			this.scroll_bottom = window.scrollY >= 30 && this.scroll < window.scrollY
			this.scroll = window.scrollY
			this.updateContactVisibility()
		},
		updateContactVisibility() {
			// Los accesos ya están en Contacto y en el pie: evitamos taparlos con sus duplicados flotantes.
			// La guarda conserva el comportamiento histórico del único WhatsApp general.
			if (!this.custom_contacts) {
				this.contact_section_visible = false
				return
			}
			this.contact_section_visible = Array.from(document.querySelectorAll('.contact-info, .site-footer')).some(section => {
				let box = section.getBoundingClientRect()
				return box.bottom > 0 && box.top < window.innerHeight
			})
		},
	},
}
</script>
<style lang="sass">
.btn-whats-app-group
	position: fixed
	bottom: 180px
	right: 25px
	display: flex
	flex-direction: column
	align-items: flex-end
	gap: 8px
	max-width: calc(100vw - 50px)
	transform: translateX(calc(100% + 25px))
	visibility: hidden
	transition: transform .3s, visibility .3s
	z-index: 1000
	@media screen and (min-width: 992px)
		right: 50px
		transform: translateX(calc(100% + 50px))
	&.btn-whats-app-active
		transform: translateX(0)
		visibility: visible
	.btn-whats-app
		background: #25D366
		color: #10351e
		border-radius: 50%
		width: 50px
		min-height: 50px
		display: flex
		justify-content: center
		align-items: center
		text-align: center
		line-height: 1.25
		text-decoration: none
		&:focus-visible
			outline: 3px solid #10351e
			outline-offset: 3px
		i
			display: flex
			justify-content: center
			align-items: center
			font-size: 25px
			flex-shrink: 0
			&::before
				position: static
				top: 0
				margin: 0
				padding: 0
				line-height: 1
	&.btn-whats-app-custom .btn-whats-app
		width: auto
		max-width: 240px
		border-radius: 25px
		padding: 10px 16px
		gap: 8px
		font-size: .9rem
		font-weight: 600
	@media (prefers-reduced-motion: reduce)
		transition: none
</style>
