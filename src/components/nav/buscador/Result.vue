<template>
<div 
@click="_toArticle"
class="result">
	<div class="data">
		<img 
		:src="articleImage(model)">
		<div>
			<p>
				{{ model.name }}
			</p>
			<p>
				{{ articlePriceEfectivo(model) }}
			</p>
		</div>
	</div>
	<i class="bi bi-chevron-right"></i>
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
	border-bottom: 1px solid color-mix(in srgb, $green 90%, black 10%) 
	&:hover
		background: color-mix(in srgb, $green 90%, black 10%)
	.data 
		display: flex
		flex-direction: row 
		img 
			border-radius: 7px
			margin-right: 10px
			width: 80px
		p 
			text-align: left 
			color: $color_text 
</style>