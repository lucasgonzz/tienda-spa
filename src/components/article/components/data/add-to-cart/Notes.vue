<template>
	<b-form-group>
		<b-form-textarea
		:rows="2"
		:disabled="is_item_in_cart(article)"
		v-model="notes" 
		placeholder="Ingrese notas para el articulo"></b-form-textarea>
	</b-form-group> 
</template>

<script>
import articles from '@/mixins/articles'
export default {
	mixins: [articles],
	props: {
		article: Object,
	},
	computed: {
		notes: {
			get() {
				if (this.is_item_in_cart(this.article)) {
					return this.get_item_cart(this.article).pivot.notes
				}
				return this.$store.state.articles.notes
			}, 
			set(value) {
				this.$store.commit('articles/setNotes', value)
			}
		},
	}
}
</script>