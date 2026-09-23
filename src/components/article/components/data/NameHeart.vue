<template>
	<div 
	class="cont-name m-b-15">
		<!--
			En la ficha el nombre es el h1 de la pagina (mision seo-tiendas). En el modal de agregar
			al carrito sigue siendo un <p>: el modal se abre encima de otra pagina que ya tiene su
			h1. Mismo aspecto en los dos casos: todo el estilo cuelga de .product-name, y los
			margenes de un h1 (reboot de Bootstrap) coinciden con los que .product-name ya fija.
		-->
		<h1
		v-if="es_ficha"
		class="product-name">
			{{ article_to_show.name }}
		</h1>
		<p
		v-else
		class="product-name">
			{{ article_to_show.name }}
		</p>
		<p
		v-if="commerce_has_extencion('article_num_in_online')"
		class="num">
			N° {{ article_to_show.num }}
		</p>
		<!-- <p
		@click="share"
		class="compartir">
			Compartir
		</p> -->
	</div>
</template>
<script>
export default {
	name: 'NameHeart',
	computed: {
		/**
		 * Si esta instancia es la de la ficha (y no la del modal de agregar al carrito, que usa
		 * el mismo componente y tambien se abre desde la ficha). Mismo criterio que es_ficha de
		 * article-view/Index.vue: la ruta y que no haya un BModal entre los padres.
		 *
		 * @returns {boolean}
		 */
		es_ficha() {
			if (this.$route.name != 'Article') {
				return false
			}
			let padre = this.$parent
			while (padre) {
				if (padre.$options && padre.$options.name == 'BModal') {
					return false
				}
				padre = padre.$parent
			}
			return true
		},
	},
	methods: {
		classHeart() {
			if (this.article_to_show.is_favorite) {
				return 'bi bi-heart-fill text-danger'
			}
			return 'bi bi-heart text-danger'
		},
		favorite() {
			if (this.checkAuth()) {
				if (this.article_to_show.is_favorite) {
					this.$set(this.article_to_show, 'is_favorite', false)
				} else {
					this.$set(this.article_to_show, 'is_favorite', true)
				}
				this.$api.get(`/articles/favorite/${this.article_to_show.id}`)
				.then(() => {
					this.$store.dispatch('favorites/getFavorites')
					this.$store.commit('favorites/setPage', 2)
				})
				.catch(err => {
					this.$toast.error('Error al añadir a favoritos')
					console.log(err)
				})
			} 
		},
	}
}
</script>
<style scoped lang="sass">
@import '@/sass/_custom'
.cont-name
	display: flex
	flex-direction: column 
	justify-content: flex-start
	p 
		text-align: left
	.product-name
		font-size: 1.5em
		font-weight: bold
		text-align: left
		margin-bottom: 0
	.num 
		margin-top: 5px
		font-size: 1em
	.compartir 
		margin-top: 5px
		font-size: 1em
		text-decoration: underline
.bi-heart, .bi-heart-fill 
	font-size: 1.7em
	cursor: pointer
	transition: all .1s
	padding-left: 1em
	&:active
		transform: scale(1.1)
</style>