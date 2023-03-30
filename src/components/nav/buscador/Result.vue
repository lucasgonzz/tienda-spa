<template>
<div 
@click="_toArticle"
class="result">
	<div class="data">
		<img 
		:src="model.images[0].hosting_url">
		<div>
			<p>
				{{ model.name }}
			</p>
			<p>
				{{ price(model.final_price) }}
			</p>
		</div>
	</div>
	<i class="icon-right"></i>
</div>
</template>
<script>
import articles from '@/mixins/articles'
export default {
	mixins: [articles],
	props: {
		model: Object,
	},
	methods: {
		_toArticle() { 
			this.$emit('clearResults') 
			this.toArticle(this.model)
		}
	}
}
</script>
<style lang="sass">
@import '@/sass/_custom'
.result
	display: flex 
	flex-direction: row 
	justify-content: space-between
	padding: 10px
	width: 100%
	cursor: pointer
	border-bottom: 1px solid darken($green, 10) 
	&:hover
		background: darken($green, 10)
	.data 
		display: flex
		flex-direction: row 
		img 
			border-radius: 7px
			margin-right: 10px
			width: 80px
		p 
			text-align: left 
</style>