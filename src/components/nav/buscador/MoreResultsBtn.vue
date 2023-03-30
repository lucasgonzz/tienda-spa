<template>
	<div
	class="p-10"
	v-if="results.length >= 6">
		<b-button
		@click="moreResults"
		variant="primary">
			Ver todos los resultados
		</b-button>
	</div>
</template>
<script>
export default {
	props: {
		results: Array,
	},
	methods: {
		moreResults() {
			this.$emit('clearResults')
			this.$store.commit('categories/setPage', 1)
			this.$store.dispatch('categories/searchArticles')
			if (this.$route.path != '/') {
				this.$router.push({name: 'Home'})
				this.scrollTo('articles-list')
			}
		}
	}
}
</script>