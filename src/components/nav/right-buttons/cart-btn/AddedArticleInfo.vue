<template>
	<div
	:class="commerce.online_configuration.register_to_buy ? 'added-article-register-to-buy' : ''"
	id="added-article-info">
		<div 
		@click.stop="close"
		class="btn-cancel c-p">
			<i class="icon-cancel"></i>
		</div>
		<last-article
		v-if="added_item"
		:article="added_item"></last-article>
	</div>
</template>
<script>
export default {
	components: {
		LastArticle: () => import('@/components/nav/right-buttons/cart-btn/LastArticle'),
	},
	computed: {
		cart() {
			return this.$store.state.cart.cart 
		},
		added_item() {
			return this.$store.state.cart.added_item 
		},
	},
	methods: {
		close() {
			document.getElementById('added-article-info').classList.remove('added-article-info-active')
		}
	}
}
</script>
<style lang="sass">
.added-article-info-active
	display: block !important
	opacity: 100 !important
#added-article-info
	cursor: default
	display: none
	opacity: 0
	z-index: 200
	transition: all .2s
	position: absolute
	background: #DEDEDE
	width: 300px
	padding: 10px 15px 10px 10px
	top: 110%
	border-radius: 5px
	box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px
	// @media screen and (max-width: 992px)
	right: 0

	// @media screen and (min-width: 992px)
	// 	right: -59px

	&::before 
		position: absolute
		display: block
		content: ''
		width: 0 
		height: 0 
		top: -7px
		border-left: 7px solid transparent
		border-right: 7px solid transparent
		border-bottom: 7px solid #DEDEDE
		right: 11.5%
		// @media screen and (max-width: 992px)
		// 	right: 11.5%
		// @media screen and (min-width: 992px)
		// 	left: 64%

	.btn-cancel
		position: absolute 
		right: 5px
		top: 5px
		font-size: 15px

.added-article-register-to-buy
	right: -59px
	&::before 
		left: 84%
</style>