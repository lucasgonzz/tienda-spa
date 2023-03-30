<template>
	<div
	v-if="article && article.sizes && article.sizes.length">
		<p
		class="text-left">
			Talles disponibles
		</p>
		<b-form-select
		:options="sizes_options"
		v-model="article.size"></b-form-select>
		<!-- <div 
		class="cont-sizes">
			<div 
			@click="setSize(size)"
			v-for="size in article.sizes"
			:key="size.id"
			:class="isSizeSelected(size)"
			class="size b-r c-p">
				{{ size.value }}
			</div>
		</div> -->
	</div>
</template>
<script>
export default {
	computed: {
		article() {
			return this.$store.state.articles.article_to_show
		},
		sizes_options() {
			let options = []
			options.push({
				text: 'Seleccionar talle',
				value: 0,
			})
			this.article.sizes.forEach(size => {
				options.push({
					text: size.value,
					value: size,
				})
			})
			return options
		},
	}, 
	methods: {
		setSize(size) {
			if (!this.isArticleInCart()) {
				this.$set(this.article, 'size', size)
			} else {
				this.$toast.error('Ya esta en el carrito')
				console.log('ya esta en el carrito')
			}
		},
		isSizeSelected(size) {
			if (this.article.size && this.article.size.id == size.id) {
				return 'size-selected shadow-4'
			}
			return ' shadow-3'
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
@import '@/sass/_custom.scss'
.cont-sizes
	display: flex
	.size 
		padding: .5em 1em
		margin: 0 .5em 1em  
	.size-selected 
		border: 1px solid $green
</style>