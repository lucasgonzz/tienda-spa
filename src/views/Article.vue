<template>
	<div
	v-if="data_seted"
	class="article-page view">
		<add-to-cart-modal></add-to-cart-modal>

		<advise></advise>

		<div class="article-page__main">
			<article-view></article-view>
		</div>

		<section
		class="article-page__section article-page__section--similars">
			<p class="article-page__section-eyebrow">
				También te puede interesar
			</p>
			<similars></similars>
		</section>

		<section class="article-page__section article-page__section--contact">
			<contact-info></contact-info>
		</section>
	</div>
</template>

<script>
import Advise from '@/components/article/modals/Advise'

import CanSeePrices from '@/components/home/components/CanSeePrices'
import CategoryInfo from '@/components/article/components/CategoryInfo'
import ArticleImage from '@/components/article/components/ArticleImage'
import ArticleData from '@/components/article/components/data/Index'
import Variants from '@/components/article/components/data/Variants'
import Description from '@/components/article/components/Description'
import Questions from '@/components/article/components/questions/Index'
import Similars from '@/components/article/components/Similars'
import Preguntar from '@/components/article/components/Preguntar'
import Categories from '@/components/categories/components/Categories'
import Platelets from '@/components/home/components/platelets/Index'
import articles from '@/mixins/articles'

/**
 * Vista detalle de artículo: layout envuelto para alinearlo con el resto de páginas retail de la tienda.
 */
export default {
	name: 'Article',
	mixins: [articles],
	metaInfo() {
		return {
			titleTemplate: this.title,
			meta: [{ vmid: 'description', name: 'description', content: this.description }],
		}
	},
	components: {
		Advise,

		CanSeePrices,
		CategoryInfo,
		ArticleImage,
		ArticleData,
		Variants,
		Description,
		Questions,
		Similars,
		Preguntar,
		Categories,
		Platelets,

		ArticleView: () => import('@/components/article/components/article-view/Index'),
		ContactInfo: () => import('@/components/common/ContactInfo'),
		AddToCartModal: () => import('@/components/common/add-to-cart-modal/Index'),
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
				let title = this.article.name
				if (this.article.bodega) {
					title += ' - ' + this.article.bodega.name
				}
				return title
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
			this.$store
				.dispatch('articles/getArticleToShow', {
					slug: this.$route.params.slug,
					commerce_id: this.$route.params.commerce_id,
				})
				.then(() => {
					this.setArticleProps()
				})
		},
		setArticleProps() {
			this.$store.dispatch('articles/getSimilars')
			this.checkCartArticle()
			this.data_seted = true
		},
	},
	created() {
		this.getArticleToShow()
		setTimeout(() => {
			this.$scrollToTop()
		}, 300)
	},
	watch: {
		$route(to, from) {
			this.getArticleToShowBySlug()
		},
	},
	beforeRouteLeave(to, from, next) {
		this.$store.commit('articles/setArticleToShow', null)
		next()
	},
}
</script>

<style lang="scss" scoped>
.article-page {
  font-family: var(--font-family-sans, sans-serif);
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding-bottom: 2rem;
}

.article-page__main {
  margin-bottom: 0.5rem;
}

.article-page__section {
  margin-top: 2rem;
  padding-top: 1.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.article-page__section--contact {
  padding-bottom: 0.5rem;
  /*
   * Rompe el max-width del padre y ocupa todo el ancho del viewport (carril completo).
   */
  width: 100vw;
  max-width: none;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  box-sizing: border-box;
}

.article-page__section-eyebrow {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--secondary-color);
  margin-bottom: 0.35rem;
  text-align: center;

  @media (min-width: 992px) {
    text-align: left;
    padding-left: 0.25rem;
  }
}

/* Oculta el título nativo de Similars (la sección ya muestra el eyebrow). */
.article-page__section--similars ::v-deep .title {
  display: none;
}

.article-page__section--similars ::v-deep .cont-models {
  margin-top: 0.25rem;
}
</style>
