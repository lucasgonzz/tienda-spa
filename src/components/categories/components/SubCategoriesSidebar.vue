<template>
    <b-sidebar 
    right
	v-if="selected_category && selected_sub_category && sub_categories.length && !selected_category.is_index"
	ref="sub-categories-sidebar"
    id="sub-categories-sidebar">
        <div
        class="p-20">
            <p 
			v-for="sub_category in sub_categories"
			:key="sub_category.id+selected_category.id"
			@click="setSubCategory(sub_category)"
			:class="isSelectedSubCategory(sub_category) ? 'selected' : ''"
			class="sub-category">
				{{ sub_category.name }}
			</p>
        </div>
    </b-sidebar>
</template>
<script>
import categories from '@/mixins/categories'
export default {
	mixins: [categories],
	methods: {
		setSubCategory(sub_category) {
			this.$refs['sub-categories-sidebar'].hide()
			this.setSelectedSubCategory(sub_category)
		}
	}
}
</script>
<style lang="sass">
#sub-categories-sidebar
	p
		color: rgba(0,0,0,.8)
</style>