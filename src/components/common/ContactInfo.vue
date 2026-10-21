<template>
	<b-row v-if="items.length" class="contact-info justify-content-center">
		<b-col cols="12" class="contact-info__inner">
			<p class="contact-info__eyebrow">Estamos cerca</p>
			<h2 class="contact-info__title">Encontranos en</h2>
			<ul class="contact-info__list">
				<li v-for="item in items" :key="item.name">
					<a
					class="contact-info__link"
					:href="item.link"
					:target="item.external ? '_blank' : null"
					:rel="item.external ? 'noopener noreferrer' : null"
					:aria-label="item.name + (item.external ? ' (abre en una pestaña nueva)' : '')">
						<i :class="'bi bi-' + item.icon + ' contact-info__icon'" aria-hidden="true"></i>
						<span class="contact-info__label">
							<strong>{{ item.name }}</strong>
							<span>{{ item.description }}</span>
						</span>
						<i :class="'bi bi-' + (item.external ? 'arrow-up-right' : 'arrow-right') + ' contact-info__arrow'" aria-hidden="true"></i>
					</a>
				</li>
			</ul>
		</b-col>
	</b-row>
</template>
<script>
export default {
	computed: {
		items() {
			let items = []
			let configuration = this.commerce.online_configuration || {}
			if (this.commerce.phone) {
				items.push({ name: 'WhatsApp', icon: 'whatsapp', description: 'Abrir chat', link: 'https://api.whatsapp.com/send?phone=' + this.commerce.phone, external: true })
			}
			// Las redes pertenecen al comercio: la demo corrige sus datos en la fuente, sin reemplazar las de clientes.
			if (configuration.instagram) {
				items.push({ name: 'Instagram', icon: 'instagram', description: 'Ver perfil', link: configuration.instagram, external: true })
			}
			if (configuration.facebook) {
				items.push({ name: 'Facebook', icon: 'facebook', description: 'Ver perfil', link: configuration.facebook, external: true })
			}
			if (this.commerce.email) {
				items.push({ name: 'Email', icon: 'envelope', description: 'Escribinos', link: 'mailto:' + this.commerce.email, external: false })
			}
			return items
		},
	},
}
</script>
<style lang="sass" scoped>
.contact-info
	// La raíz sigue siendo la row: la ficha compensa sus márgenes por esta clase.
	background: #f6f6f8
	color: #26262b
	font-family: var(--font-family-sans)
	padding: 2rem 0
	border-top: 1px solid #e5e5ea
	border-bottom: 1px solid #e5e5ea
	.contact-info__inner
		max-width: 1060px
		padding: 0 24px
	.contact-info__eyebrow
		margin: 0 0 0.35rem
		color: #595963
		font-size: 0.72rem
		font-weight: 600
		letter-spacing: 0.1em
		text-transform: uppercase
		text-align: center
	.contact-info__title
		margin: 0 0 1.25rem
		font-size: 1.4rem
		font-weight: 700
		text-align: center
		line-height: 1.3
	.contact-info__list
		display: flex
		flex-wrap: wrap
		justify-content: center
		gap: 12px
		list-style: none
		padding: 0
		margin: 0
		li
			flex: 1 1 210px
			max-width: 300px
			min-width: 0
	.contact-info__link
		display: flex
		align-items: center
		gap: 12px
		width: 100%
		min-height: 80px
		padding: 15px
		border-radius: 14px
		border: 1px solid #dedee3
		background: #fff
		color: #26262b
		text-decoration: none
		text-align: left
		transition: background-color .15s ease, border-color .15s ease
		&:hover
			background: #eeeef2
			border-color: #a7a7b0
			color: #26262b
			text-decoration: none
		// No depende del color del comercio, que podría no contrastar contra el fondo claro.
		&:focus-visible
			outline: 3px solid #26262b
			outline-offset: 3px
	.contact-info__icon
		font-size: 1.5rem
		flex-shrink: 0
	.contact-info__label
		display: flex
		flex-direction: column
		gap: 2px
		min-width: 0
		strong
			font-size: .95rem
			font-weight: 600
		span
			color: #595963
			font-size: .8rem
	.contact-info__arrow
		margin-left: auto
		font-size: .85rem
		flex-shrink: 0
	@media (max-width: 575.98px)
		padding: 1.5rem 0
		.contact-info__inner
			padding: 0 20px
		.contact-info__list li
			flex-basis: 100%
			max-width: none
		.contact-info__link
			min-height: 68px
	@media (prefers-reduced-motion: reduce)
		.contact-info__link
			transition: none
</style>
