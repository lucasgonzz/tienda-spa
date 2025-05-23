<template>
	<div 
	:style="_style"
	class="cont-sub-categories">
		<div 
		v-for="sub_category in category.sub_categories"
		:key="sub_category.id"
		@click.stop="setSubCategory(category, sub_category)"
		class="sub-category">
			<div class="j-between">
				<span>
					<i 
					class="icon-right"></i>
					{{ sub_category.name }}
				</span>

				({{ sub_category.articles_count }})
			</div>
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
.cont-sub-categories
	
	.sub-category
		// background: rgba
		// background: lighten($green, 30)
		padding: 12px 15px 12px 40px
		color: $hover_color_text

		&:hover
			background: lighten($green, 30)
</style>