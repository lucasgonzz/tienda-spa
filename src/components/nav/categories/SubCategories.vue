<template>
	<div 
	:style="_style"
	:class="scroll_bottom ? 'short-nav' : 'full-nav'"
	class="cont-sub-categories">
		<div 
		v-for="sub_category in category.sub_categories"
		:key="sub_category.id"
		@click.stop="setSubCategory(category, sub_category)"
		class="sub-category">
			<i 
			class="icon-right d-lg-none"></i>
			{{ sub_category.name }}
		</div>
	</div>
</template>
<script>
import _categories from '@/mixins/_categories'
export default {
	mixins: [_categories],
	props: {
		category: Object,
		set_sub_categories_position: Boolean,
	},
	data() {
		return {
			scroll: 0,
			scroll_bottom: false,
			left: 0,
		}
	},
	watch: {
		set_sub_categories_position() {
			this.setLeft()
		},
	},
	created() {
		window.addEventListener('scroll', () => {
			if (this.scroll < window.scrollY) {
				if (window.scrollY >= 30) {
					this.scroll_bottom = true
				}
			} else {
				this.scroll_bottom = false
			} 
			this.scroll = window.scrollY
		})
	},
	computed: {
		_style() {
			return 'left: '+this.left+'px'
		},
	},
	methods: {
		setLeft() {
			let categories = document.getElementById('cont-categories')
			let left = categories.getBoundingClientRect().right-5
			this.left = left 
		},
	}
}
</script>
<style lang="sass">
@import '@/sass/_custom'
.full-nav
	top: 135px
.short-nav
	top: 105px
.cont-sub-categories
	scrollbar-width: auto
	scrollbar-color: #333 #333

	&::-webkit-scrollbar
		width: 5px
		height: 5px

	&::-webkit-scrollbar-track 
		background: #fff
		margin-top: 5px

	&::-webkit-scrollbar-thumb 
		background-color: lighten(#333, 20)
		border: 2px solid #333

	@media screen and (max-width: 992px)
		background: darken($green, 10)
		margin: 0 -15px
	@media screen and (min-width: 992px)
		opacity: 0
		display: none
		background: #FFF
		position: fixed
		width: 300px
		transition: all .2s
		border-radius: 0 5px 5px 0
		box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px
		height: calc(70vh - 30px)
		// max-height: calc(70vh - 30px)
		overflow-y: auto
		&::before
			position: absolute
			display: block
			content: ''
			width: 0 
			height: 0 
			top: 15px
			left: -7px
			border-top: 7px solid transparent
			border-bottom: 7px solid transparent 
			border-right:7px solid #FFF 
	.sub-category
		@media screen and (max-width: 992px)
			padding: 12px 15px
		@media screen and (min-width: 992px)
			padding: 12px 30px
		color: #000
		&:hover
			background: $green
			color: $hover_color_text
</style>