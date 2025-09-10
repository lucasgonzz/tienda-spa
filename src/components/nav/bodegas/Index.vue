<template>
	<b-sidebar
    shadow
    @shown="disableScroll" 
    @hidden="enableScroll"
    v-model="bodegas_sidebar_visibility"
	title="Bodegas"
	class="cont-items"
	id="cont-bodegas">
		<div 
		v-for="bodega in bodegas"
		:key="bodega.id"
		:class="is_active_bodega(bodega) ? 'active-item' : ''"
		class="item">
			<div 
			@click.stop="setBodega(bodega)"
			class="header">
				<span>
					{{ bodega.name }}
				</span>
				<div
				class="j-end">
					({{ bodega.articles_count }})
				</div>
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
		bodegas() {
			return this.$store.state.bodegas.models
		},
		selected_bodega() {
			return this.$store.state.categories.selected_bodega
		},
        bodegas_sidebar_visibility: {
            get() {
                return this.$store.state.auth.bodegas_sidebar_visibility
            },
            set(value) {
                this.$store.commit('auth/set_bodegas_sidebar_visibility', value)
            }
        },
	},
	methods: {
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
		is_active_bodega(bodega) {
			return this.selected_bodega && this.selected_bodega.id == bodega.id
		},
	    setBodega(bodega) {
	    	this.enableScroll()
			this.$router.push({name: 'Home', params: { category: 'bodega', sub_category: this.routeString(bodega.name)}})

			this.$bvModal.hide('add-to-cart-modal')
			this.$store.commit('categories/setSelectedCategory', null)
			this.$store.commit('categories/setIsFromSearch', false)
			this.$store.commit('categories/setSelectedSubCategory', null)
			this.$store.commit('categories/setSelectedBodega', bodega)
			this.$store.dispatch('categories/getArticles')

			// if (this.$route.name != 'Home') {
			// }

			// esto es para que se esconda en nav de mobile 
			this.$store.commit('auth/setMobileSidebarVisibility', false)
			this.$store.commit('auth/set_categories_sidebar_visibility', false)
			this.$store.commit('auth/set_bodegas_sidebar_visibility', false)
			
			this.scrollTo('articles-list')
	    },
	    
	}
}
</script>