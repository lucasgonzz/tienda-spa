<template>
	<span
	class="compartir-btn m-b-15"
	@click="compartir_por_whatsapp">
		<i class="bi bi-whatsapp"></i>
		Compartir
	</span>
</template>
<script>
export default {
	name: 'Compartir',
	props: {
		/**
		 * Artículo visible en la vista detalle (slug y nombre para el mensaje).
		 */
		article: {
			type: Object,
			required: true,
		},
	},
	methods: {
		/**
		 * Arma la URL pública absoluta del artículo para compartir.
		 *
		 * @returns {string}
		 */
		get_article_public_url() {
			/* Slug del artículo o el de la ruta actual como respaldo. */
			let slug = this.article && this.article.slug
				? this.article.slug
				: this.$route.params.slug
			/* Identificador del comercio en la URL de la tienda. */
			let commerce_id = process.env.VUE_APP_COMMERCE_ID || this.$route.params.commerce_id
			let route_location = this.$router.resolve({
				name: 'Article',
				params: {
					slug: slug,
					commerce_id: commerce_id,
				},
			})
			/* Base pública de la tienda (env) o el origen actual del navegador. */
			let base_url = process.env.VUE_APP_APP_URL || window.location.origin
			base_url = base_url.replace(/\/$/, '')
			return base_url + route_location.href
		},
		/**
		 * Abre WhatsApp con un mensaje prearmado que incluye nombre y link del artículo.
		 *
		 * @returns {void}
		 */
		compartir_por_whatsapp() {
			if (!this.article) {
				return
			}
			/* Texto que verá el usuario al elegir el contacto en WhatsApp. */
			let article_url = this.get_article_public_url()
			let article_name = this.article.name ? this.article.name : 'este producto'
			let message = 'Mirá este producto: ' + article_name + '
' + article_url
			let encoded_message = encodeURIComponent(message)
			let whatsapp_url = 'https://wa.me/?text=' + encoded_message
			/* Misma estrategia que Thanks.vue: nueva pestaña o redirección si el popup falla. */
			let opened_window = window.open(whatsapp_url, '_blank')
			if (!opened_window) {
				window.location.href = whatsapp_url
			}
		},
	},
}
</script>
<style scoped lang="sass">
.compartir-btn
	display: inline-flex
	align-items: center
	gap: 6px
	cursor: pointer
	color: #111111
	font-size: 14px
	font-weight: 500
	user-select: none
	&:hover
		color: #333333
