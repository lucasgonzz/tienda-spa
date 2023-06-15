<template>
	<div class="home view">
		<sub-categories-sidebar></sub-categories-sidebar>
		
		<title-jumbotron></title-jumbotron>	
		

		<order-by></order-by>

		<b-row
		class="row-articles">
			<b-col
			:class="class_products"
			cols="12"
			xl="10">
				<waiting-call></waiting-call>
				<articles-list></articles-list> 
			</b-col>
		</b-row>
		
		<contact-info></contact-info> 
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
		ContactInfo: () => import('@/components/common/ContactInfo'),
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
