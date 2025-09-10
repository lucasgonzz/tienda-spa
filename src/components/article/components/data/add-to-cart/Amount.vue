<template>
	<div
	class="article-amount">
		<b-form-input 
		:placeholder="placeholder"
		@keyup.enter="addToCart"
		:disabled="is_item_in_cart(article)"
		v-model="amount"
		type="number"
		id="item-amount"
		@keyup="check_amount"
		@click="check_amount"></b-form-input>

	</div>
</template>
<script>
import articles from '@/mixins/articles'
export default {
	mixins: [articles],
	props: {
		article: Object,
	},
	created() {
		this.set_focus()
	},
	computed: {
		placeholder() {
			if (this.commerce_has_extencion('vinoteca')) {
				if (this.article.presentacion) {
					return 'Cant CAJAS'
				}
			}
			if (this.max) {
				return 'Max '+this.max 
			}
			return ''
		},
		amount: { 
			get() {
				if (this.is_item_in_cart(this.article)) {
					return this.get_item_cart(this.article).pivot.amount
				}
				return this.$store.state.articles.amount
			}, 
			set(value) {
				this.$store.commit('articles/setAmount', value)
			}
		},
		max() {
			if (
				this.article.article_variants
				&& this.article.article_variants.length 
				&& this.selected_article_variant 
				&& this.selected_article_variant.stock
			) {
				return this.selected_article_variant.stock 
			} else if (this.article.stock != null) {
				return this.article.stock 
			}
			return null
		}
	},
	methods: { 
		set_focus() {
			if (this.ancho_pantalla > 500) {
				setTimeout(() => {
					document.getElementById('item-amount').focus()
				}, 500)
			}
		},
		addToCart() {
			this.$emit('addToCart')
		},
		check_amount() {
			if (this.max && this.amount > this.max) {

				this.$toast.error('Solo hay '+this.max+' unidades en STOCK')
				this.amount = this.max
			}
		},
		increment() {
			if (this.article.article_variants.length && !this.selected_article_variant) {
				let text = ''
				let index = 0
				this.article.article_properties.forEach(article_property => {
					if (index == 0) {
						text += article_property.article_property_type.name+' '
					} else {
						text += 'y '+article_property.article_property_type.name+' '
					}
					index++
				})
				this.$toast.error('Seleccione '+text)
			} else if (this.amount < this.max) {
				this.$store.commit('articles/incrementAmount')
			} else {
				this.$toast.error('Ha alcanzado el maximo')
			}
		},
		decrement() {
			this.$store.commit('articles/decrementAmount')
		},
	}
}
</script>
<style lang="sass">