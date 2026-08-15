<template>
	<button
	v-if="authenticated && articles.length"
	type="button"
	class="btn-nav btn-promocion m-r-15 apretable"
	aria-label="Ver mi promoción"
	@click="abrir">
		<i class="bi bi-tag"></i>
		<b-badge
		variant="danger"
		class="badge">
			{{ articles.length }}
		</b-badge>
	</button>
</template>
<script>
/**
 * El acceso permanente a la oferta despues de haber cerrado el mensaje.
 *
 * Vive adentro de .cont-nav, que es position: fixed con z-index 100, o sea visible en toda
 * la tienda y en todo momento del scroll — que es literalmente lo que pidio Lucas.
 *
 * Al clic REABRE el mismo overlay (hay una sola implementacion del mensaje en el SPA) y no
 * marca descarte: el comprador lo acaba de pedir.
 *
 * Cuando la oferta vence, la lista queda vacia y el boton desaparece solo: no hay ningun
 * estado que limpiar.
 */
export default {
	computed: {
		articles() {
			return this.$store.state.client_offers.articles
		},
	},
	methods: {
		/**
		 * @returns {void}
		 */
		abrir() {
			this.$store.commit('client_offers/set_indice', 0)
			this.$store.commit('client_offers/set_mensaje_visible', true)
		},
	},
}
</script>
<style lang="sass">
// Se usa var(--text-color) directo y no el $color_text de _custom.scss a proposito: ese
// archivo importa Bootstrap entero, y cada componente que lo importa se lleva una copia al
// bundle. El valor es el mismo ($color_text es var(--text-color)).
.btn-promocion
	position: relative
	i
		font-size: 26px
		color: var(--text-color) !important
	.badge
		padding: 5px 8px
		font-size: 14px

	// A 360px el navbar ya lleva cuatro botones: el icono baja un escalon para no apretar.
	@media screen and (max-width: 576px)
		i
			font-size: 22px
		.badge
			padding: 4px 6px
			font-size: 12px
</style>
