<template>
	<div
	class="article-variants"
	v-if="article_to_show.article_properties.length">
		<b-form-select
		v-for="article_property in article_to_show.article_properties"
		:key="article_property.id"
		:options="getOptions(article_property)"
		v-model="article_to_show.selected_article_properties[article_property.id]"
		@change="setSelectedVariant()"></b-form-select>
	</div>
</template>
<script>
import articles from '@/mixins/articles'
export default {
	name: 'ArticleProperties',
	mixins: [articles],
	computed: {
		article_to_show() {
			return this.$store.state.articles.article_to_show
		},
		selected_article_variant() {
			return this.$store.state.articles.selected_article_variant
		},
	},
	methods: {
		getOptions(article_property) {
			console.log(article_property)
			let options = []
			options.push({
				value: 0,
				text: 'Seleccione '+article_property.article_property_type.name,
			})
			article_property.article_property_values.forEach(article_property_value => {
				options.push({
					value: article_property_value.id,
					text: article_property_value.name,
				})
			})
			return options
		},
		setSelectedVariant() {
			let is_variant = true
			let selected_variant = null
			this.article_to_show.article_variants.find(article_variant => {

				article_variant.article_property_values.forEach(article_property_value => {
					if (!this.isSelectedPropertyValue(article_property_value)) {
						is_variant = false 
					} 
				})

				if (is_variant) {
					selected_variant = article_variant
				} else {
					is_variant = true 
				}

			}) 

			if (selected_variant) {
				this.$store.commit('articles/setSelectedArticleVariant', selected_variant)
				this.article_to_show.variant_id = selected_variant.id 
				this.setVariantImage()
				console.log('selected_variant')
				console.log(selected_variant)
			} else {
				this.$store.commit('articles/setSelectedArticleVariant', null)
			}
		},
		isSelectedPropertyValue(article_property_value) {
			return this.article_to_show.selected_article_properties[article_property_value.article_property_type_id] == article_property_value.id
		},
	}
}
</script>
<style lang="sass">
.article-variants
	select 
		margin-bottom: 15px
</style>