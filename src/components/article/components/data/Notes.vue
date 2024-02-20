<template>
	<b-form-group
	label="Notas para el articulo">
		<b-form-textarea
		class="m-b-15"
		:rows="5"
		v-model="notes"
		placeholder="Ingrese notas para el articulo"></b-form-textarea>
	</b-form-group>
</template>

<script>
import articles from '@/mixins/articles'
export default {
	mixins: [articles],
	computed: {
		notes: {
			get() {
				return this.$store.state.articles.notes
			}, 
			set(value) {
				this.$store.commit('articles/setNotes', value)
			}
		},
	}
}
</script>