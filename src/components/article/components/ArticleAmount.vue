<template>
	<div
	class="article-amount m-b-20">
		<div
		class="btn-content">
			<b-button
			@click="decrement"
			:disabled="amount == 0">
				<i class="icon-minus"></i>
			</b-button>
			<b-form-input
			type="number"
			:min="1"
			:max="max"
			v-model="amount"></b-form-input>
			<b-button
			@click="increment">
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
@import '@/sass/_custom'
.article-amount
	display: flex
	flex-direction: columns
	align-items: center
	justify-content: space-between
	width: 150px

	.btn-content
		display: flex
		flex-direction: columns
		.btn 
			border: none
			box-shadow: none
			// padding: 10px 15px
			color: $green
			&:first-child
				border-radius: 10px 0 0 10px
				border-top: 1px solid rgba(0,0,0,.3)
				border-left: 1px solid rgba(0,0,0,.3)
				border-bottom: 1px solid rgba(0,0,0,.3)
			&:last-child
				border-radius: 0 10px 10px 0
				border-top: 1px solid rgba(0,0,0,.3)
				border-right: 1px solid rgba(0,0,0,.3)
				border-bottom: 1px solid rgba(0,0,0,.3)
			background: none
		input 
			border: none
			border-top: 1px solid rgba(0,0,0,.3)
			border-bottom: 1px solid rgba(0,0,0,.3)
			border-radius: 0
			width: 50px
			height: 50px
			background: none
			box-shadow: none !important
</style>