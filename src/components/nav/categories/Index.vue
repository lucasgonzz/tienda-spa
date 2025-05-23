<template>
	<b-sidebar
    shadow
    @shown="disableScroll" 
    @hidden="enableScroll"
	title="Categorias"
	class="cont-items"
	id="cont-categories">
		<div 
		v-for="category in categories"
		:key="category.id"
		:class="is_active_category(category) ? 'active-item' : ''"
		class="item">
			<div 
			class="header">
				<span
				@click.stop="setCategory(category)">
					{{ category.name }}
				</span>

				<div
				class="j-end"
				@click.stop="show_sub_categories(category)"
				v-if="category.sub_categories.length">
					({{category.sub_categories.length}}) 
					<i 
					class="icon-down-open p-l-5"></i>
				</div>

				<div
				class="j-end"
				@click.stop="show_sub_categories(category)"
				v-else>
					({{ category.articles_count }})
				</div>
			</div>

			<div
			class="cont-sub-categories-parent"
			v-if="category.sub_categories.length">

				<sub-categories
				:set_sub_categories_position="set_sub_categories_position"
				v-if="is_active_category(category)"
				:category="category"></sub-categories>
			</div>		
		</div>	
	</b-sidebar>
</template>
<script>
import categories from '@/mixins/_categories'
export default {
	mixins: [categories],
	props: {
		show: Boolean,
	},
	components: {
		SubCategories: () => import('@/components/nav/categories/SubCategories'),
	},
	computed: {
		categories() {
			return this.$store.state.categories.categories
		},
	},
	created() {
		console.log('se creo categories')
	},
	data() {
		return {
			show_sub_category: 0,
			set_sub_categories_position: false,
		}
	}, 
	methods: {
		is_active_category(category) {
			return this.show_sub_category == category.id
		},
	    disableScroll() {
	    	if (!this.is_mobile) {
	    		console.log('desactivando scroll')
	      		document.body.style.overflow = 'hidden';
	    	}
	    },
	    enableScroll() {
	      	document.body.style.overflow = 'auto';
	    },
		hover() {
			if (!this.set_sub_categories_position) {
				this.set_sub_categories_position = true
			}
		},
		setCategory(category, check_mobile = true) {
			this.setSelectedCategory(category)
		},
		show_sub_categories(category) {
			if (this.show_sub_category == category.id) {
				this.show_sub_category = 0
			} else {
				this.show_sub_category = category.id 
			}
		},
	}
}
</script>
<style lang="sass">
@import '@/sass/_custom'
#cont-categories

	&:hover 
		font-weight: normal

	.item
		cursor: pointer 
		text-align: left
		color: #333
		margin: 0

		&:hover
			background: $green
			color: $hover_color_text
			font-weight: bold

	.active-item
		background: $green
		color: $hover_color_text
		font-weight: bold


	.header
		display: flex  
		flex-direction: row  
		justify-content: space-between
		padding: 10px 20px
		border-bottom: 1px solid rgba(0,0,0,.3)

		span
			width: 80% 
			// border: 2px solid red

		div
			width: 20% 
			// border: 2px solid green

		
</style>