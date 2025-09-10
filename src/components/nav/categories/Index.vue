<template>
	<b-sidebar
    shadow
    @shown="disableScroll" 
    @hidden="enableScroll"
    v-model="categories_sidebar_visibility"
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
        categories_sidebar_visibility: {
            get() {
                return this.$store.state.auth.categories_sidebar_visibility
            },
            set(value) {
                this.$store.commit('auth/set_categories_sidebar_visibility', value)
            }
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
	    	console.log('activando scroll')
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