<template>
	<b-sidebar
    shadow
    @hidden="enableScroll"
    v-model="cepas_sidebar_visibility"
	title="Cepas"
	class="cont-items"
	id="cont-cepas">
		<div 
		v-for="cepa in cepas"
		:key="cepa.id"
		:class="is_active_cepa(cepa) ? 'active-item' : ''"
		class="item">
			<div 
			@click.stop="setCepa(cepa)"
			class="header">
				<span>
					{{ cepa.name }}
				</span>
				<div
				class="j-end">
					({{ cepa.articles_count }})
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
	computed: {
		cepas() {
			return this.$store.state.cepas.models
		},
		selected_cepa() {
			return this.$store.state.categories.selected_cepa
		},
        cepas_sidebar_visibility: {
            get() {
                return this.$store.state.auth.cepas_sidebar_visibility
            },
            set(value) {
                this.$store.commit('auth/set_cepas_sidebar_visibility', value)
            }
        },
	},
	watch: {
	    cepas_sidebar_visibility(new_val) {
	        if (new_val) {
	            this.disableScroll()
	        }
	    }
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
		is_active_cepa(cepa) {
			return this.selected_cepa && this.selected_cepa.id == cepa.id
		},
	    setCepa(cepa) {
	    	this.enableScroll()
			this.$router.push({name: 'Home', params: { category: 'cepa', sub_category: this.routeString(cepa.name)}})

			this.$bvModal.hide('add-to-cart-modal')
			this.$store.commit('categories/setSelectedCategory', null)
			this.$store.commit('categories/setIsFromSearch', false)
			this.$store.commit('categories/setSelectedSubCategory', null)
			this.$store.commit('categories/setSelectedBodega', null)
			this.$store.commit('categories/setSelectedCepa', cepa)
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