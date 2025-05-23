<template>
	<b-modal
	size="xl"
	title="Agregar al carrito"
	hide-footer
	id="add-to-cart-modal">
		<article-view></article-view>
	</b-modal>
</template>
<script>
export default {
	components: {
		ArticleView: () => import('@/components/article/components/article-view/Index'),
	},
}
</script>
<style lang="sass">
#add-to-cart-modal
	.modal-content
		background: #EBEBEB
</style>