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
import search from '@/mixins/search'
export default {
	mixins: [search],
	props: {
		results: Array,
	},
	methods: {
		moreResults() {
			this.$emit('clearResults')
			this.searchArticle()
		}
	}
}
</script>