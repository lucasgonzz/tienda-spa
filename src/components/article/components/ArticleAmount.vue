<template>
	<div
	v-if="article && articlePriceEfectivo(article)"
	class="article-amount m-b-20">
		<span>
			Unidades
		</span>
		<div
		class="btn-content">
			<b-button
			@click="decrement"
			:disabled="amount == 0"
			size="sm"
			variant="success">
				<i class="icon-minus"></i>
			</b-button>
			<b-form-input
			type="number"
			:min="1"
			:max="max"
			v-model="amount"></b-form-input>
			<b-button
			size="sm"
			@click="increment"
			variant="success">
				<i class="icon-plus"></i>
			</b-button>
		</div>
	</div>
</template>
<script>
export default {
	computed: {
		article() {
			return this.$store.state.articles.article_to_show
		},
		amount: {
			get() {
				return this.$store.state.articles.amount
			}, 
			set(value) {
				this.$store.commit('articles/setAmount', value)
			}
		},
		max() {
			if (this.article_to_show.stock != null) {
				return this.article_to_show.stock 
			}
			return 1000
		}
	},
	methods: {
		increment() {
			if (this.amount < this.max) {
				this.$store.commit('articles/incrementAmount')
			}
		},
		decrement() {
			this.$store.commit('articles/decrementAmount')
		},
	}
}
</script>
<style lang="sass">
.article-amount
	display: flex
	flex-direction: columns
	align-items: center
	justify-content: space-between
	width: 100%
	.btn-content
		display: flex
		flex-direction: columns
		.btn 
			&:first-child
				border-radius: 50px 0 0 50px
			&:last-child
				border-radius: 0 50px 50px 0
		input 
			border-radius: 0
			width: 4em
</style>