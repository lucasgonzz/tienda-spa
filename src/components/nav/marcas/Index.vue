<template>
	<b-sidebar
    shadow
    @hidden="enableScroll"
    v-model="brands_sidebar_visibility"
	title="Marcas"
	class="cont-items"
	id="cont-marcas">
		<div
		v-for="brand in brands"
		:key="brand.id"
		:class="is_active_brand(brand) ? 'active-item' : ''"
		class="item">
			<div
			@click.stop="setBrand(brand)"
			class="header">
				<span>
					{{ brand.name }}
				</span>
				<div
				class="j-end">
					({{ brand.articles_count }})
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
		brands() {
			return this.$store.state.categories.brands
		},
		selected_brand() {
			return this.$store.state.categories.selected_brand
		},
		brands_sidebar_visibility: {
			get() {
				return this.$store.state.auth.brands_sidebar_visibility
			},
			set(value) {
				this.$store.commit('auth/set_brands_sidebar_visibility', value)
			}
		},
	},
	watch: {
		brands_sidebar_visibility(new_val) {
			if (new_val) {
				this.disableScroll()
			} else {
				this.enableScroll()
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
		is_active_brand(brand) {
			return this.selected_brand && this.selected_brand.id == brand.id
		},
		/**
		 * Filtra el catalogo por marca y navega a Home con /inicio/marca/:sub_category.
		 * A diferencia de setBodega/setCepa (que solo cierran su propio sidebar mas el
		 * de categorias), esta cierra los CUATRO flags de sidebar -- el de marcas
		 * incluido -- para no dejar el propio sidebar abierto despues de elegir una marca.
		 */
		setBrand(brand) {
			this.enableScroll()
			this.$router.push({name: 'Home', params: { category: 'marca', sub_category: this.routeString(brand.name)}})

			this.$bvModal.hide('add-to-cart-modal')
			this.$store.commit('categories/setSelectedCategory', null)
			this.$store.commit('categories/setIsFromSearch', false)
			this.$store.commit('categories/setSelectedSubCategory', null)
			this.$store.commit('categories/setSelectedBodega', null)
			this.$store.commit('categories/setSelectedCepa', null)
			this.$store.commit('categories/setSelectedBrand', brand)
			this.$store.dispatch('categories/getArticles')

			// esto es para que se esconda en nav de mobile
			this.$store.commit('auth/setMobileSidebarVisibility', false)
			this.$store.commit('auth/set_categories_sidebar_visibility', false)
			this.$store.commit('auth/set_bodegas_sidebar_visibility', false)
			this.$store.commit('auth/set_cepas_sidebar_visibility', false)
			this.$store.commit('auth/set_brands_sidebar_visibility', false)

			this.scrollTo('articles-list')
		},

	}
}
</script>
