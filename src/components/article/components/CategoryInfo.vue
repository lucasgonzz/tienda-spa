<template>
	<b-col
	class="d-none d-md-flex"
	cols="12"
	lg="10">
		
		<div class="category-info">
			
			<div 
			@click="home"
			class="item">
				<i class="icon-home p-r-5"></i>
				Volver al inicio
			</div>
			<div 
			@click="setSelectedCategory(category)"
			class="item"
			v-if="category">
				{{ category.name }}
			</div>
			<div 
			@click="setSubCategory(category, sub_category)"
			class="item"
			v-if="sub_category">
				{{ sub_category.name }}
			</div>
		</div>

	</b-col>
</template>
<script>
import nav from '@/mixins/nav'
import _categories from '@/mixins/_categories'
export default {
	mixins: [nav, _categories],
	computed: {
		article() {
			return this.$store.state.articles.article_to_show
		},
		categories() {
			return this.$store.state.categories.categories
		},
		category() {
			if (this.article.category_id) {
				return this.categories.find(category => {
					return category.id == this.article.category_id
				})
			}
			return null
		},
		sub_category() {
			if (this.article.sub_category_id && this.category) {
				return this.category.sub_categories.find(sub_category => {
					return sub_category.id == this.article.sub_category_id
				})
			}
			return null
		},
	}
}
</script>
<style lang="sass">
@import '@/sass/_custom'
.category-info
	margin-top: 25px
	display: flex 
	flex-direction: row
	font-weight: bold 
	font-size: 1em

	.item 
		padding: 0 20px 
		border-right: 2px solid rgba(0, 0, 0, .4)
		cursor: pointer

		&:hover
			color: $green

		&:first-child
			padding-left: 0	

		&:last-child
			border-right: none
</style>
