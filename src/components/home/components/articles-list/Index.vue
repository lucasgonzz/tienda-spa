<template>
<div
id="articles-list">
	<div
	v-if="!loading_articles && !loading_categories">
		<promociones-vinoteca></promociones-vinoteca>

		<featured></featured>

		<in-offer></in-offer>

		<novedades></novedades>

		<p 
		v-if="selected_category || selected_sub_category || selected_bodega"
		class="title">
			<span
			v-if="selected_category">
				{{ selected_category.name }}
			</span>
			<span
			v-else-if="selected_sub_category">
				{{ selected_sub_category.name }}
			</span>
			<span
			v-else-if="selected_bodega">
				{{ selected_bodega.name }}
			</span>
		</p>
		<p
		class="title"
		v-else-if="is_from_search">
			Resultados
		</p>
		<p
		class="title"
		v-else>
			Ultimos ingresos
		</p>
		<div
		class="cont-models"
		v-if="articles.length">

			<article-card
			v-for="article in articles"
			:key="article.id"
			:article="article"></article-card>

			<infinite-loading 
			spinner="spiral"
			@infinite="infiniteHandler">
				<div slot="no-more" class="not-results">
					<span>
						No hay mas artículos
					</span>
				</div>
				<div slot="no-results">
				</div>
			</infinite-loading>

		</div>
		<p 
		v-else
		class="text-with-icon m-t-100 m-b-100">
			<i class="icon-search"></i>
			No se encontraron resultados
		</p>
		
	</div>
	<div
	v-else>
		<div
		v-for="j in 6"
		:key="j">
			<!-- Hace de titulo de las subCategorias -->
			<b-skeleton width="50%" type="input" class="m-t-50 m-b-50"></b-skeleton>
			<div class="cont-models m-t-15">
				<article-card-skeleton
				v-for="i in 10"
				:key="i"></article-card-skeleton>
			</div>
		</div>
	</div>
</div>
</template>
<script>
import InfiniteLoading from 'vue-infinite-loading'

import Featured from '@/components/home/components/articles-list/Featured'
import InOffer from '@/components/home/components/articles-list/InOffer'
import Novedades from '@/components/home/components/articles-list/Novedades'

import ArticleCard from '@/components/common/article-card/Index'
import ArticleCardSkeleton from '@/components/common/ArticleCardSkeleton'
import VueHorizontalList from "vue-horizontal-list"
import articles_mixin from "@/mixins/articles"
import VueScreenSize from 'vue-screen-size'
export default {
	name: 'ArticleList',
	mixins: [articles_mixin, VueScreenSize.VueScreenSizeMixin],
	components: {
		PromocionesVinoteca: () => import('@/components/home/components/articles-list/PromocionesVinoteca'),
		InfiniteLoading,
		Featured,
		InOffer,
		Novedades,
		ArticleCard,
		ArticleCardSkeleton,
		VueHorizontalList,
	},
	data() {
		return {
			index: 0,
		}
	},
	computed: {
		loading_articles() {
			return this.$store.state.categories.loading_articles
		},
		loading_categories() {
			return this.$store.state.categories.loading_categories
		},
		page() {
			return this.$store.state.categories.page
		},
		per_page() {
			return this.$store.state.categories.per_page
		},
		// infiniteId() {
		// 	return this.$store.state.articles.infiniteId
		// },
		sub_categories() {
			return this.$store.state.categories.sub_categories_to_show
		},
		featured() {
			return this.$store.state.articles.featured
		},
		articles() {
			return this.$store.state.categories.articles 
		},
		last_uploads() {
			return this.$store.state.articles.last_uploads
		},
		search_query() {
			return this.$store.state.categories.search_query
		},
		selected_category() {
			return this.$store.state.categories.selected_category
		},
		selected_bodega() {
			return this.$store.state.categories.selected_bodega
		},
		is_from_search() {
			return this.$store.state.categories.is_from_search
		},
		categories() {
			return this.$store.state.categories.categories
		},
		order_by() {
			return this.$store.state.categories.order_by
		},
		is_from_categories() {
			return this.selected_category || this.selected_sub_category
		},
	},
	methods: {
		showContactInfo() {
			if (this.index == 5) {
				return true
				this.index = 0
			} else {
				this.index++
				return false
			}
		},
		right() {
			let ul = document.getElementById('cont-featured')
			ul.scroll(ul.getBoundingClientRect().width - 100, 0)
			console.log(ul.getBoundingClientRect().width)
			this.scroll++
		},
		infiniteHandler($state) {
			if (this.commerce.online_configuration.scroll_infinito_en_home || (this.page < 3 || this.is_from_search || this.is_from_categories) && this.articles.length >= 12) {
				this.$store.commit('categories/incrementPage')
				let url = 'articles/'
				if (this.selected_category) {
					url += 'from-category/'+this.selected_category.id+'/0/0/'+this.order_by
				} else if (this.selected_sub_category) {
					url += 'from-category/0/'+this.selected_sub_category.id+'/0/'+this.order_by
				} else if (this.selected_bodega) {
					url += 'from-category/0/0/'+this.selected_bodega.id+'/'+this.order_by
				} else if (this.is_from_search) {
					url += 'search/'+this.search_query
				} else {
					url += 'featured-last-uploads'
				}
				url += `/${process.env.VUE_APP_COMMERCE_ID}?page=${this.page}`
				console.log(url)
				this.$api.get(url)
				.then(res => {
					console.log(res)
					let articles = res.data.articles.data
					if (articles.length) {
						this.$store.commit('categories/addArticles', articles)
						$state.loaded()
					} else {
						$state.complete()
						console.log('complete')
					}
				})
				.catch(err => {
					console.log(err)
				})
			} else {
				$state.complete()
			}
		},
	}
}
</script>
<style lang="sass">
.paddings
	padding: 0 0 1em
.cont-featured
	position: relative
.btn-right
	position: absolute
	right: 0
	background: #000
	color: #FFF
	z-index: 100
	top: 45%
	cursor: pointer
</style>
