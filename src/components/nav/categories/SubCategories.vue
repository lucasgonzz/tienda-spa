<template>
	<div 
	class="cont-sub-categories">
		<div 
		v-for="sub_category in category.sub_categories"
		:key="sub_category.id"
		@click.stop="setSubCategory(sub_category)"
		class="sub-category">
			<i 
			class="icon-right d-lg-none"></i>
			{{ sub_category.name }}
		</div>
	</div>
</template>
<script>
export default {
	props: {
		category: Object,
	},
	methods: {
		setSubCategory(sub_category) {
			console.log(sub_category)
			this.$store.commit('categories/setSelectedCategory', null)
			this.$store.commit('categories/setSelectedSubCategory', sub_category)
			this.$store.dispatch('categories/getArticles')
			if (this.route_name != 'Home' || this.$route.params.category == 'ultimos-ingresados') {
				this.$router.push({name: 'Home'})
			}
			this.$store.commit('auth/setMobileSidebarVisibility', false)
			this.scrollTo('articles-list')
		}
	}
}
</script>
<style lang="sass">
@import '@/sass/_custom'

.cont-sub-categories
	@media screen and (max-width: 992px)
		background: darken($green, 10)
		// opacity: 0
		// display: none
		margin: 0 -15px
	@media screen and (min-width: 992px)
		background: #FFF
		position: absolute
		left: 100%
		top: 0
		width: 300px
		opacity: 0
		display: none
		transition: all .2s
		border-radius: 0 5px 5px 0
		box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px
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
			color: #000
</style>