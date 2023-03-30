<template>
	<div class="view">
		<b-row>
			<b-col
			cols="12">
				<b-card
				class="categories"
				no-body>
					<sub-categories-list
					:redirect_to_home="true"></sub-categories-list>
				</b-card>
			</b-col>
		</b-row>
	</div>
</template>
<script>
import SubCategoriesList from '@/components/categories/components/SubCategoriesList'
export default {
	components: {
		SubCategoriesList
	},
	computed: {
		selected_category() {
			return this.$store.state.categories.selected_category
		}
	},
	created() {
		this.setTitle(this.selected_category.name)
	},
}
</script>