export default {
	methods: {
		/**
		 * Dispara la busqueda completa y refleja el termino en la URL (?q=<termino>) para
		 * que sea compartible: copiar el link o recargar la pagina reproduce los mismos
		 * resultados (ver App.vue::getSearchFromUrl()).
		 *
		 * Sin `params` en el push/replace, Vue Router resuelve el Home SIN category/
		 * sub_category (no los hereda de la ruta actual porque se navega por `name`) --
		 * asi que buscar desde una marca/categoria filtrada limpia esa parte de la URL,
		 * consistente con que la busqueda ya reemplazo los articulos mostrados.
		 *
		 * replace (no push) cuando ya esta parado en Home, para no ensuciar el historial
		 * con una entrada por cada busqueda. El .catch() absorbe el rechazo que Vue Router
		 * tira cuando la navegacion es redundante (mismo name, mismo query -- p. ej. Enter
		 * dos veces seguidas con el mismo termino).
		 */
		searchArticle() {
			this.$store.dispatch('categories/searchArticles')
			let termino = this.$store.state.categories.search_query
			if (this.$route.name == 'Home') {
				this.$router.replace({name: 'Home', query: { q: termino }}).catch(() => {})
			} else {
				this.$router.push({name: 'Home', query: { q: termino }}).catch(() => {})
			}
			this.scrollTo('articles-list')
		},
	}
}