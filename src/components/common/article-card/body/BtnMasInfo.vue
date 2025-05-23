<template>
	<div 
	class="cont-buttons m-t-10">
		
		<b-button
		:class="authenticated ? 'btn-mas-info' : 'w-100'"
		@click="toArticle(article)"
		variant="primary">
			<span
			class="d-sm-none">
				Ver
			</span>
			<span
			class="d-none d-sm-block">
				Ver mas
			</span>
		</b-button>
 		
 		<template
 		v-if="authenticated">
			<b-button
			v-if="!is_item_in_cart(article)"
			class="btn-add-to-cart"
			@click.stop="add_to_cart"
			variant="outline-primary">
				<i class="icon-cart"></i>
			</b-button>

			<b-button
			v-else
			class="btn-add-to-cart"
			@click="remove_cart(article)"
			variant="danger">
				<i class="icon-cart"></i>
			</b-button>
 		</template>

	</div>
</template>
<script>
import articlesMixin from '@/mixins/articles'
export default {
	mixins: [articlesMixin],
	props: {
		article: Object,
	},
	methods: {
		add_to_cart() {
			this.$store.commit('articles/setArticleToShow', this.article)
			this.$bvModal.show('add-to-cart-modal')
		}
	}
}
</script>
<style lang="sass">
.cont-buttons
	display: flex  
	justify-content: space-between
	flex-direction: row 

	.btn-add-to-cart
		width: 45px

	.btn-mas-info
		width: calc(100% - 45px - 10px)


.plantilla-clasico
	.btn-mas-info
		display: none

	.btn-add-to-cart
		width: 100%
</style>