<template> 
	<div 
	@click="callToArticle"
	class="model article-card animate__animated animate__fadeIn"
	:class="article_class"
	no-body>
		<div
		v-if="is_cart_view"
		@click.stop="removeArticle"
		class="btn-remove-article">
			<i class="icon-cancel"></i>
		</div>

		<div 
		v-if="!hasStock(article)"
		class="agotado">
			Agotado
		</div>

		<div class="cont-images">
			
			<vue-load-image
			class="img-fluid">
				<img 
				slot="image"
				:src="articleImage(article)">
		        <b-spinner
				slot="preloader"
		        variant="success"></b-spinner>
				<div slot="error">Imagen no encontrada</div>
			</vue-load-image>
			
		</div>
		<div
		class="card-article-body">
			<p 
			v-if="article.brand"
			class="product-brand">
				{{ article.brand.name }}
			</p>
			<p 
			translate="no"
			class="product-name">
				{{ article_name }}
			</p>
			<p 
			v-if="is_cart_view"
			class="amount">
				Cantidad: {{ article.amount }}
			</p>
			<div 
			v-if="is_cart_view && article.selected_variant"
			class="amount">
				<p
				class="m-b-0"
				v-for="article_property_value in article.selected_variant.article_property_values">
					{{ article_property_value.article_property_type.name }}: {{ article_property_value.name }}
				</p>
			</div>
			<p 
			v-if="is_order_details"
			class="amount">
				Cantidad: {{ article.pivot.amount }}
			</p>
			<p 
			v-if="articlePriceEfectivo(article)"
			translate="no"
			class="product-price">
				{{ articlePriceEfectivo(article) }}
			</p>
			<b-button
			class="btn-more-info"
			v-if="!is_mobile"
			@click="toArticle(article)"
			variant="primary">
				Más info 
			</b-button>
			<div
			class="m-t-15"
			v-if="is_cart_view && article.amount > 1">
				<hr
				class="m-t-0">
				<p
				class="text-left m-b-5">
					Las {{ article.amount }} unidades
				</p>
				<p 
				class="product-price">
					{{ price(articlePriceEfectivo(article, false) * article.amount) }}
				</p>
			</div>
		</div>
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
			if (this.shadow != 'shadow-2') {
				class_ += ' '+this.shadow
			} else {
				if (this.is_mobile) {
					class_ += ' shadow-2'
				} else {
					class_ += ' shadow-1'
				}
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
@import '@/sass/_custom'
.agotado
	position: absolute
	top: 0
	left: 0
	font-weight: bold 
	font-size: 16px
	border-radius: 4px 0 5px 0
	background: $red 
	color: #FFF
	z-index: 10
	padding: 5px 10px
</style>
 