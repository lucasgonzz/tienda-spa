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
		v-if="selected_category || selected_sub_category || selected_bodega || selected_cepa"
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
			<span
			v-else-if="selected_cepa">
				{{ selected_cepa.name }}
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
			auto_scroll_timeout: null,
			auto_scroll_interval: null,
			auto_scroll_pending_pixels: 0,
			auto_scroll_programmatic: false,
			auto_scroll_events: ['scroll'],
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
		selected_cepa() {
			return this.$store.state.categories.selected_cepa
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
		online_configuration() {
			if (this.commerce && this.commerce.online_configuration) {
				return this.commerce.online_configuration
			}
			return {}
		},
		is_from_categories() {
			return this.selected_category || this.selected_sub_category
		},
		auto_scroll_home_speed() {
			const value = Number(this.online_configuration.auto_scroll_home)
			return Number.isFinite(value) && value > 0 ? value : null
		},
		auto_scroll_home_init_seconds() {
			const value = Number(this.online_configuration.auto_scroll_home_init)
			return Number.isFinite(value) && value >= 0 ? value : 10
		},
		auto_scroll_home_interval_ms() {
			const value = Number(this.online_configuration.auto_scroll_home_interval)
			return Number.isFinite(value) && value > 0 ? value : 1000
		},
	},
	watch: {
		auto_scroll_home_speed() {
			this.restartAutoScroll()
		},
		auto_scroll_home_init_seconds() {
			this.restartAutoScroll()
		},
		auto_scroll_home_interval_ms() {
			this.restartAutoScroll()
		},
	},
	mounted() {
		this.setAutoScrollListeners()
		this.restartAutoScroll()
	},
	beforeDestroy() {
		this.clearAutoScrollTimeout()
		this.stopAutoScroll()
		this.removeAutoScrollListeners()
	},
	methods: {
		restartAutoScroll() {
			this.stopAutoScroll()
			this.clearAutoScrollTimeout()
			if (!this.auto_scroll_home_speed) {
				return
			}
			this.auto_scroll_timeout = setTimeout(() => {
				this.startAutoScroll()
			}, this.auto_scroll_home_init_seconds * 1000)
		},
		clearAutoScrollTimeout() {
			if (this.auto_scroll_timeout) {
				clearTimeout(this.auto_scroll_timeout)
				this.auto_scroll_timeout = null
			}
		},
		startAutoScroll() {
			if (!this.auto_scroll_home_speed || this.auto_scroll_interval) {
				return
			}
			this.auto_scroll_interval = setInterval(() => {
				this.auto_scroll_pending_pixels += this.auto_scroll_home_speed * this.auto_scroll_home_interval_ms / 1000

				const pixels_to_scroll = this.auto_scroll_pending_pixels > 0
					? Math.floor(this.auto_scroll_pending_pixels)
					: Math.ceil(this.auto_scroll_pending_pixels)

				if (pixels_to_scroll !== 0) {
					this.auto_scroll_programmatic = true
					window.scrollBy(0, pixels_to_scroll)
					this.auto_scroll_pending_pixels -= pixels_to_scroll
					setTimeout(() => { this.auto_scroll_programmatic = false }, 0)
				}
			}, this.auto_scroll_home_interval_ms)
		},
		stopAutoScroll() {
			if (this.auto_scroll_interval) {
				clearInterval(this.auto_scroll_interval)
				this.auto_scroll_interval = null
			}
			this.auto_scroll_pending_pixels = 0

			// alert('Se limpio autoscroll')
		},
		onUserActivity() {
			console.log('onUserActivity')
			console.log('auto_scroll_programmatic: '+this.auto_scroll_programmatic)
			console.log('auto_scroll_home_speed: '+this.auto_scroll_home_speed)
			if (this.auto_scroll_programmatic) {
				return
			}
			if (!this.auto_scroll_interval) {
				return
			}
			this.stopAutoScroll()
			// this.restartAutoScroll()
		},
		setAutoScrollListeners() {
			this.auto_scroll_events.forEach(event_name => {
				window.addEventListener(event_name, this.onUserActivity, { passive: true })
			})
		},
		removeAutoScrollListeners() {
			this.auto_scroll_events.forEach(event_name => {
				window.removeEventListener(event_name, this.onUserActivity)
			})
		},
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
			if (this.online_configuration.scroll_infinito_en_home || (this.page < 3 || this.is_from_search || this.is_from_categories) && this.articles.length >= 12) {
				this.$store.commit('categories/incrementPage')
				let url = 'articles/'
				if (this.selected_category) {
					url += 'from-category/'+this.selected_category.id+'/0/0/0/'+this.order_by
				} else if (this.selected_sub_category) {
					url += 'from-category/0/'+this.selected_sub_category.id+'/0/0/'+this.order_by
				} else if (this.selected_bodega) {
					url += 'from-category/0/0/'+this.selected_bodega.id+'/0/'+this.order_by
				} else if (this.selected_cepa) {
					url += 'from-category/0/0/0/'+this.selected_cepa.id+'/'+this.order_by
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
