<template>
	<div 
	v-if="!is_mobile || show"
	id="cont-categories">
		<div 
		v-for="category in categories"
		:key="category.id"
		class="category">
			<div 
			@click.stop="setCategory(category, false)"
			@mouseover="hover"
			class="header">
				{{ category.name }}
				<div
				@click.stop="setCategory(category)"
				v-if="category.sub_categories.length">
					<i 
					class="icon-right d-none d-lg-inline-block"></i>
					<i 
					class="icon-down d-lg-none"></i>
				</div>
			</div>
			<div
			class="cont-sub-categories-parent"
			v-if="category.sub_categories.length">
				<sub-categories
				:set_sub_categories_position="set_sub_categories_position"
				v-if="!is_mobile || show_sub_category == category.id"
				:category="category"></sub-categories>
			</div>		
		</div>	
	</div>
</template>
<script>
import categories from '@/mixins/_categories'
export default {
	mixins: [categories],
	props: {
		show: Boolean,
	},
	components: {
		SubCategories: () => import('@/components/nav/categories/SubCategories'),
	},
	computed: {
		categories() {
			return this.$store.state.categories.categories
		},
	},
	created() {
		console.log('se creo categories')
	},
	data() {
		return {
			show_sub_category: 0,
			set_sub_categories_position: false,
		}
	}, 
	methods: {
		hover() {
			if (!this.set_sub_categories_position) {
				this.set_sub_categories_position = true
			}
		},
		setCategory(category, check_mobile = true) {
			if (!this.is_mobile || !check_mobile) {
				this.setSelectedCategory(category)
			} else {
				if (this.show_sub_category == category.id) {
					this.show_sub_category = 0
				} else {
					this.show_sub_category = category.id 
				}
			}
		}
	}
}
</script>
<style lang="sass">
@import '@/sass/_custom'
#cont-categories
	scrollbar-width: auto
	scrollbar-color: #ffffff #ffffff

	&::-webkit-scrollbar
		width: 5px
		height: 5px

	&::-webkit-scrollbar-track 
		background: #333
		margin-top: 30px

	&::-webkit-scrollbar-thumb 
		background-color: lighten(#ffffff, 20)
		border: 2px solid #ffffff

	@media screen and (max-width: 992px)
		background: darken($green, 10)
		margin: 0 -15px
		padding: 0 15px
	@media screen and (min-width: 992px)
		opacity: 0	
		display: none
		transition: all .2s
		max-height: 70vh
		// width: 100vw
		overflow: visible auto

		position: absolute
		top: 0px
		left: -50px
		padding-top: 30px
		&::before
			position: absolute
			display: block
			content: ''
			width: 0 
			height: 0 
			top: 25px
			left: 80px
			border-left: 7px solid transparent
			border-right: 7px solid transparent
			border-bottom: 7px solid #333

	.category
		cursor: pointer 
		text-align: left
		z-index: 500
		// position: relative 

		@media screen and (max-width: 992px)
			width: 100%
			padding: 12px 0 
			border-bottom: 1px solid darken($green, 20)
		@media screen and (min-width: 992px)
			font-weight: bold
			font-size: 13px
			color: rgba(255,255,255,.9)
			box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px
			background: #333
			width: 300px
			padding: 12px 30px

			&:hover
				background: $green
				color: $hover_color_text
				& > .cont-sub-categories-parent > .cont-sub-categories
					opacity: 100
					display: block

		&:first-child
			border-radius: 7px 7px 0 0
		&:last-child
			border-radius: 0 0 7px 7px
		
		.header 
			@media screen and (max-width: 992px)
				background: darken($green, 10)
			display: flex
			flex-direction: row 
			justify-content: space-between
</style>