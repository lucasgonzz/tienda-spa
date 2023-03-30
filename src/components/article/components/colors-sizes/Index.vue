<template>
	<div
	v-if="article && (article.colors.length || article.sizes.length)"
	class="colors-sizes">
		<colors></colors>	
		<hr
		v-if="article.colors.length && article.sizes.length">
		<sizes></sizes>	
	</div>
</template>
<script>
import Colors from '@/components/article/components/colors-sizes/Colors'
import Sizes from '@/components/article/components/colors-sizes/Sizes'
export default {
	components: {
		Colors,
		Sizes,
	},
	computed: {
		article() {
			return this.$store.state.articles.article_to_show
		},
		amount() {
			return this.$store.state.articles.amount
		}
	},
	methods: {
		increment() {
			this.$store.commit('articles/incrementAmount')
		},
		decrement() {
			this.$store.commit('articles/decrementAmount')
		},
	}
}
</script>
<style lang="sass">
@import '@/sass/_custom'
.cont-colors
	display: flex
	flex-wrap: wrap
	.cont-color 
		width: 50px
		margin: 0 .7em 1em
		.color 
			width: 100%
			height: 50px
			display: inline-block
			border-radius: 5px
			transition: all .1s
			display: flex
		p
			width: 100%
			margin-top: .5em
			text-align: center
			margin-bottom: 0
			font-size: .8em
			overflow-wrap: break-word
	.color-selected 
		@if ($theme == dark) 
			border: 3px solid #FFF
		@else if ($theme == ligth) 
			border: 3px solid #000

		p
			padding-top: 120%
			font-size: .8em
			font-weight: bold
	.color-selected-white
		border: 3px solid rgba(0, 0, 0, .7)
		p
			padding-top: 120%
			font-size: .8em
			font-weight: bold

</style>