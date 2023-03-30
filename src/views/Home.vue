<template>
	<div class="home view">
		<sub-categories-sidebar></sub-categories-sidebar>
		<b-row
		class="m-t-0">
			<b-col
			cols="12">
				<title-jumbotron></title-jumbotron>	
			</b-col>
			<order-phone></order-phone>
            <update-button></update-button>
			<b-col
			cols="12"
			lg="10"
			xl="8">
				<platelets></platelets>	
			</b-col>
			<!-- <b-col
			cols="12"
			lg="10"
			xl="8">
				<categories></categories>
			</b-col> -->
			<b-col
			cols="12"
			lg="10"
			xl="8">
				<order-by></order-by>
			</b-col>
		</b-row>
		<b-row
		class="row-articles">
			<!-- <b-col
			v-if="selected_category && !selected_category.is_index && !selected_category.is_results"
			:class="class_products"
			cols="12"
			lg="2"
			xl="2">
				<sub-categories></sub-categories>
			</b-col> -->
			<b-col
			:class="class_products"
			cols="12"
			xl="10">
				<waiting-call></waiting-call>
				<articles-list></articles-list> 
			</b-col>
		</b-row>
		<footer-component></footer-component>
	</div>
</template>
<script>
import SubCategoriesSidebar from '@/components/categories/components/SubCategoriesSidebar'
import CanSeePrices from '@/components/home/components/CanSeePrices'
import ArticlesList from '@/components/home/components/articles-list/Index'
import TitleJumbotron from '@/components/home/components/TitleJumbotron'
import OrderPhone from '@/components/home/components/OrderPhone'
import UpdateButton from '@/components/home/components/UpdateButton'
import Platelets from '@/components/home/components/platelets/Index'
import CategoriesButton from '@/components/home/components/CategoriesButton'
import Categories from '@/components/categories/components/Categories'
import OrderBy from '@/components/home/components/OrderBy'
import SubCategories from '@/components/categories/components/SubCategories'
import WaitingCall from '@/components/home/components/WaitingCall'
import FooterComponent from '@/components/common/footer/Index'
export default {
	name: 'Home',
    metaInfo() {
    	return {
        	titleTemplate: this.commerce.company_name,
    	}
    },
	components: {
		SubCategoriesSidebar,
		TitleJumbotron,
		OrderPhone,
		CategoriesButton,
		UpdateButton,
		Platelets,
		CanSeePrices,
		ArticlesList,
        // Categories,
        OrderBy,
        SubCategories,
        WaitingCall,
        FooterComponent,
	},
	computed: {
		selected_category() {
			return this.$store.state.categories.selected_category
		},
		articles() {
			return this.$store.state.articles.articles
		},
		featured() {
			return this.$store.state.articles.featured
		},
		categories() {
			return this.$store.state.categories.categories
		},
		class_categories() {
			return 'm-t-15'
			if (this.is_mobile || this.categories.length < this.categories_breakpoint_limit) {
				return 'col-categories-mobile'
			}
			return 'col-categories-desktop'
		},
		class_products() {
			return ''
			if (this.is_mobile) {
				return 'm-t-50'
			}
			if (!this.is_mobile || this.categories.length < this.categories_breakpoint_limit) {
				return 'm-t-70'
			}
			return 'col-products-desktop m-t-50'
		},
		cols_lg() {
			return 11
			if (this.is_mobile || this.categories.length < this.categories_breakpoint_limit) {
				return 10
			}
			return 12
		},
	},
}
</script>
<style scoped lang="sass">
// .home 		
	// margin-top: -15px
.row-articles
	position: relative
.col-categories-mobile
	position: fixed
	z-index: 90
	left: 0 
	padding: 0
	width: 100%
.col-categories-desktop
	position: fixed
	z-index: 90
	left: 0 
	width: 250px
.col-products-desktop
	padding-left: 250px
	padding-right: 50px
</style>
