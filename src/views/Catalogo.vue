<template>
	<b-container
	class="catalogo-page view view-p-t"
	fluid="lg">
		<h2
		class="catalogo-page__heading">
			Catálogo
		</h2>

		<section
		class="catalogo-page__section">
			<h3
			class="catalogo-page__subheading">
				Categorías
			</h3>
			<div
			v-if="!loading_categories && categories.length"
			class="category-catalog__grid">
				<category
				v-for="category in categories"
				:key="'cat-' + category.id"
				:item="category"
				@select="on_category_selected"></category>
			</div>
			<div
			v-else-if="loading_categories"
			class="category-catalog__grid category-catalog__grid--skeleton">
				<div
				class="category-catalog-skeleton"
				v-for="i in skeleton_placeholders"
				:key="'sk-c-' + i">
					<b-skeleton
					height="200px"
					width="100%"></b-skeleton>
				</div>
			</div>
			<p
			v-else
			class="catalogo-page__empty">
				No hay categorías para mostrar.
			</p>
		</section>

		<section
		class="catalogo-page__section catalogo-page__section--brands">
			<h3
			class="catalogo-page__subheading">
				Marcas
			</h3>
			<div
			v-if="!loading_brands && brands.length"
			class="category-catalog__grid">
				<category
				v-for="brand in brands"
				:key="'brand-' + brand.id"
				:item="brand"
				@select="on_brand_selected"></category>
			</div>
			<div
			v-else-if="loading_brands"
			class="category-catalog__grid category-catalog__grid--skeleton">
				<div
				class="category-catalog-skeleton"
				v-for="j in skeleton_placeholders"
				:key="'sk-b-' + j">
					<b-skeleton
					height="200px"
					width="100%"></b-skeleton>
				</div>
			</div>
			<p
			v-else
			class="catalogo-page__empty">
				No hay marcas para mostrar.
			</p>
		</section>
	</b-container>
</template>
<script>
import categories_mixin from '@/mixins/_categories'

export default {
	name: 'Catalogo',
	metaInfo() {
		return {
			title: 'Catálogo',
		}
	},
	components: {
		Category: () => import('@/components/catalogo/Category'),
	},
	mixins: [categories_mixin],
	data() {
		return {
			skeleton_placeholders: 8,
		}
	},
	computed: {
		categories() {
			return this.$store.state.categories.categories
		},
		loading_categories() {
			return this.$store.state.categories.loading_categories
		},
		brands() {
			return this.$store.state.categories.brands
		},
		loading_brands() {
			return this.$store.state.categories.loading_brands
		},
	},
	created() {
		let st = this.$store.state.categories
		if (!st.brands.length && !st.loading_brands) {
			this.$store.dispatch('categories/getBrands')
		}
	},
	methods: {
		on_category_selected(category) {
			this.setSelectedCategory(category)
		},
		on_brand_selected(brand) {
			this.setSelectedBrand(brand)
		},
	},
}
</script>
<style lang="sass" scoped>
@import '@/sass/_custom'
.catalogo-page
	&__heading
		text-align: center
		margin-bottom: 1.25rem
		color: #333
		font-weight: bold
	&__subheading
		text-align: center
		margin-bottom: 1rem
		color: #333
		font-weight: bold
		font-size: 1.15rem
	&__section
		margin-bottom: 2.5rem
		&--brands
			margin-bottom: 1rem
	&__empty
		text-align: center
		color: #333
.category-catalog__grid
	display: grid
	grid-template-columns: repeat(2, 1fr)
	gap: 2px
	background: #fff
	@media screen and (min-width: 768px)
		grid-template-columns: repeat(3, 1fr)
	@media screen and (min-width: 1200px)
		grid-template-columns: repeat(4, 1fr)
	&--skeleton
		.category-catalog-skeleton
			padding: 1px
	::v-deep .category-catalog-tile
		filter: grayscale(100%)
	&:hover
		::v-deep .category-catalog-tile
			filter: grayscale(100%)
		::v-deep .category-catalog-tile:hover
			filter: grayscale(0%)
		::v-deep .category-catalog-tile:hover .category-catalog-tile__label
			background: $blue
	@media (hover: none)
		::v-deep .category-catalog-tile
			filter: none
		&:hover
			::v-deep .category-catalog-tile:hover .category-catalog-tile__label
				background: rgba(0, 0, 0, 0.72)
</style>
