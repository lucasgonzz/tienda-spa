<template> 
	<div 
	class="model article-card animate__animated animate__fadeIn"
	@click="set_article"
	:class="article_class"
	no-body>
		
		<!-- <btn-remove
		:article="article"></btn-remove> -->

		<agotado-info
		:article="article"></agotado-info>	

		<article-image
		:article="article"></article-image>	

		<card-body
		:article="article"></card-body>
	</div>
</template>
<script>
import VueLoadImage from 'vue-load-image'
import articlesMixin from '@/mixins/articles'
export default {
	name: 'ArticleCard',
	mixins: [articlesMixin],
	props: {
		article: Object,
		full_width: {
			type: Boolean,
			default: false
		},
		shadow: {
			type: String,
			default: 's'
		},
	},
	components: {
		VueLoadImage,
		BtnRemove: () => import('@/components/common/article-card/BtnRemove'),
		AgotadoInfo: () => import('@/components/common/article-card/AgotadoInfo'),
		ArticleImage: () => import('@/components/common/article-card/ArticleImage'),
		CardBody: () => import('@/components/common/article-card/body/Index'),
	},
	computed: {
		is_cart_view() {
			return this.$route.name == 'Cart'
		},
		is_order_details() {
			return this.$route.name == 'Orders'
		},
		article_class() {
			let class_ = ''
			if (this.full_width) {
				class_ += ' full-width'
			}
			return class_
		},
		article_name() {
			if (this.article.variant) {
				return this.article.name + ' ' + this.article.variant.description
			} else {
				return this.article.name
			}
		},
		cart() {
			return this.$store.state.cart.cart 
		},
 	},
	methods: {
		set_article() {
			if (this.commerce.online_configuration.online_template.slug == 'clasico') {
				this.toArticle(this.article)
			}
		},
		callToArticle() {
			if (this.is_mobile) {
				this.toArticle(this.article)
			}
		},
		removeArticle() {
			this.$store.commit('cart/removeArticle', {
				item: this.article,
				remove_only_one_amount: true
			})
			if (this.authenticated) {
				this.$store.dispatch('cart/removeArticle', this.article)
			} else {
				localStorage.cart = JSON.stringify(this.cart) 
			}
		},
	}
}
</script>
<style lang="sass">
.article-card
	overflow: hidden /* Para que los elementos ocultos no se desborden */

.plantilla-clasico
	.article-card
		cursor: pointer
</style>
 