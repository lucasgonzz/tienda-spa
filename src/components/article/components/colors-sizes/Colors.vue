<template>
	<div
	v-if="article_to_show && article_to_show.colors && article_to_show.colors.length">
		<p
		class="text-left">
			Colores disponibles
		</p>
		<div 
		class="cont-colors">
			<div 
			@click="setColor(color)"
			v-for="color in article_to_show.colors"
			:key="color.id"
			:class="isColorSelected(color) ? 'selected-color' : ''"
			class="cont-color">
				<div 
				:style="{backgroundColor: color.value}"
				class="color shadow-4 c-p"></div>
				<p>
					{{ color.name }}
				</p>
			</div>
		</div>
	</div>
</template>
<script>
import Vue from 'vue'
import articles from '@/mixins/articles'
export default {
	mixins: [articles],
	computed: {
		color() {
			return this.$store.state.articles.color
		},
	}, 
	methods: {
		setColor(color) {
			if (!this.is_item_in_cart()) {
				this.setColorAndImages(color)
				this.$scrollToTop()
			} else {
				this.$toast.error('Ya esta en el carrito')
			}
		},
		isColorSelected(color) {
			return this.color.id == color.id
		},
		checkCart(color) {
			let article = this.cart_articles.find(art => {
				return art.id == this.article.id
			})
			if (article != undefined) {
				this.$store.commit('cart/removeArticle', article)
				article.color = color
				this.$store.commit('cart/addArticle', article)
				console.log('checkCart')
				console.log(article)
				this.$store.dispatch('cart/save')
			}
		}
	}
}
</script>
<style lang="sass">
.selected-color 
	transform: scale(1.2)
	transition: all .2s
</style>