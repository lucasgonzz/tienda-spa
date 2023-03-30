<template>
<b-modal
v-if="order"
id="order-details"
title="Detalle de la compra"
hide-footer>
	<article-card
	v-for="article in order.articles"
	:key="article.id"
	:article="article"></article-card>
	<p class="order-total">
		Total: {{ price(total(order)) }}
	</p>
</b-modal>
</template>
<script>
import ArticleCard from '@/components/common/ArticleCard'
import OrdersMixin from '@/mixins/orders'
export default {
	mixins: [OrdersMixin],
	components: {
		ArticleCard
	},
	computed: {
		order() {
			return this.$store.state.orders.details
		},
	},
}
</script>
<style scoped lang="sass">
.order-total
	font-size: 1.2em
	margin-bottom: 0
	margin-top: 1em
	font-weight: bold
</style>