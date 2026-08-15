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
 * Cuando una oferta vence, la lista vuelve vacia en el proximo refresco y el boton desaparece
 * solo. Ese refresco NO es automatico: pasa cuando el comprador abre el mensaje desde aca
 * (ver abrir()), que es el unico momento en que una oferta vencida le importaria.
 */
export default {
	computed: {
		/**
		 * 🔴 Sale del GETTER y no de state.client_offers.articles: el getter compara contra la
		 * sesion de ahora, asi que el badge no puede quedar contando las ofertas del comprador
		 * anterior despues de un cambio de sesion sin recarga. Ver articles_vigentes.
		 *
		 * @returns {Array}
		 */
		articles() {
			return this.$store.getters['client_offers/articles_vigentes']
		},
	},
	methods: {
		/**
		 * @returns {void}
		 */
		abrir() {
			this.$store.commit('client_offers/set_indice', 0)
			this.$store.commit('client_offers/set_mensaje_visible', true)
			/*
			 * 🔴 Y se refrescan las ofertas justo aca, que es la unica vez que se refrescan.
			 *
			 * getModels corre una sola vez por sesion de SPA, asi que una oferta que vencio a
			 * medianoche seguiria contada en el badge y se seguiria abriendo con un "Válida
			 * hasta el ..." en pasado hasta que el comprador recargue la pagina. Este es el
			 * momento exacto en que las va a mirar, y no le agrega ni un request al que solo
			 * navega. Si la oferta ya no esta, la lista vuelve vacia, el overlay se cierra
			 * solo (su `visible` mira articles.length) y este boton desaparece.
			 */
			this.$store.dispatch('client_offers/getModels')
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
