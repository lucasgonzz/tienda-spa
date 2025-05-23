<template> 
	<div
	v-if="is_cart_view"
	@click.stop="removeArticle"
	class="btn-remove-article">
		<i class="icon-cancel"></i>
	</div>
</template>
<script>
import articlesMixin from '@/mixins/articles'
export default {
	mixins: [articlesMixin],
	props: {
		article: Object,
	},
	computed: {
		is_cart_view() {
			return this.$route.name == 'Cart'
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
 