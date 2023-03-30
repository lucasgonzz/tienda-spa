<template>
	<div
	class="col-sub-categories d-none d-lg-block"
	v-if="selected_category && !selected_category.is_index && !selected_category.is_results">
		<p
		class="sub-category-title m-t-0">
			Categorias
		</p>
		<div
		v-if="!loading_sub_categories">
			<p 
			v-for="sub_category in sub_categories"
			:key="sub_category.id"
			@click="setSelectedSubCategory(sub_category)"
			:class="isSelectedSubCategory(sub_category) ? 'selected' : ''"
			class="sub-category apretable">
				<i 
				v-if="isSelectedSubCategory(sub_category)"
				class="icon-right"></i>
				{{ sub_category.name | first_upper }}
			</p>
		</div>
		<div
		v-else>
			<b-skeleton
			v-for="i in 5"
			:key="i"
			class="m-b-15"
			width="100%"></b-skeleton>
		</div>
	</div>
</template>
<script>
import categories from '@/mixins/categories'
export default {
	mixins: [categories],
}
</script>
<style lang="sass">
@import '@/sass/_custom.scss'
.col-sub-categories
	// position: absolute
	padding: 15px
	@if ($theme == dark) 
		background: rgba(0,0,0,.8)
		height: min-content
	.sub-category-title
		font-size: 1em
		text-align: left
		font-weight: bold
	.sub-category
		text-align: left 
		cursor: pointer
		font-size: .9em
		&.selected 
			font-weight: bold
</style> 