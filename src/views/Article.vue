<template>
	<div 
	class="view article-view">
		<advise></advise>	
		<b-row 
		v-if="data_seted"
		class="m-b-0 m-xl-b-15">

			<category-info></category-info>

			<b-col
			cols="12"
			lg="10"
			xl="7">
				<article-image></article-image>
			</b-col>
			<b-col
			class="p-relative"
			cols="12"
			md="11"
			lg="10"
			xl="3">
				<article-data></article-data>
				<variants></variants>
				<div class="positions">
					<description></description>
					<!-- <preguntar></preguntar> -->
				</div>
			</b-col>
		</b-row>
		<similars></similars>

		<contact-info></contact-info>

		<!-- <questions></questions> -->
	</div>
</template>
<script>
import Advise from '@/components/article/modals/Advise'

import CanSeePrices from '@/components/home/components/CanSeePrices'
import CategoryInfo from '@/components/article/components/CategoryInfo'
import ArticleImage from '@/components/article/components/ArticleImage'
import ArticleData from '@/components/article/components/data/Index'
import ArticleAmount from '@/components/article/components/ArticleAmount'
import Variants from '@/components/article/components/data/Variants'
import Description from '@/components/article/components/Description'
import Questions from '@/components/article/components/questions/Index'
import Similars from '@/components/article/components/Similars'
import Preguntar from '@/components/article/components/Preguntar'
import Categories from '@/components/categories/components/Categories'
import Platelets from '@/components/home/components/platelets/Index'
import articles from '@/mixins/articles'
export default {
	name: 'Article',
	mixins: [articles],
    metaInfo() {
    	return {
        	titleTemplate: this.title,
        	meta: [
	          { vmid: 'description', name: 'description', content: this.description }
	        ]
    	}
    },
	components: {
		Advise,

		CanSeePrices,
		CategoryInfo,
		ArticleImage,
		ArticleData,
		ArticleAmount,
		Variants,
		Description,
		Questions,
		Similars,
		Preguntar,
		Categories,
		Platelets,
		ContactInfo: () => import('@/components/common/ContactInfo'),
	},
	data() {
		return {
			loading: false,
			data_seted: false,
		}
	},
	computed: {
		article() {
			return this.$store.state.articles.article_to_show
		},
		title() {
			if (this.article) {
				return this.article.name
			}
			return ''
		},
		description() {
			if (this.article) {
				let description = this.article.name
				description += ' a solo ' + this.article.price + '. Retira por el local o pedi que te lo enviemos'
				return description
			}
			return ''
		},
	},
	methods: {
		getArticleToShow() {
			if (!this.article) {
				this.getArticleToShowBySlug()
			} else {
				this.setArticleProps()
			}
		},
		getArticleToShowBySlug() {
			this.$store.dispatch('articles/getArticleToShow', {slug: this.$route.params.slug, commerce_id: this.$route.params.commerce_id}) 
			.then(() => {
				this.setArticleProps()
			})
		},
		setArticleProps() {
			this.setTitle(this.article.name)
			this.$store.dispatch('articles/getSimilars')
			this.checkCartArticle()
			this.data_seted = true
		}
	},
	created() {
		this.getArticleToShow()
		setTimeout(() => {
        	this.$scrollToTop()
        	console.log('SCROLL')
		}, 300)
	},
	watch: {
		$route(to, from) {
			this.getArticleToShowBySlug()
		}
	},
	beforeRouteLeave(to, from, next) {
		this.$store.commit('articles/setArticleToShow', null)
		next()
	},
}
</script>
<style scpoed lang="sass">
.view 
	// @media screen and (max-width: 992px)
	// 	margin-bottom: 2em
.article-view
	// padding-bottom: 123px
.row 
	justify-content: center
	margin-top: 1em
	margin-bottom: 1.5em

.position
	@media screen and (min-width: 1200px)
		position: absolute
		width: 100%
</style>