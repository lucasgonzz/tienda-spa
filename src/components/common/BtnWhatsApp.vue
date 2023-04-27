<template>
	<a 
	v-if="commerce.phone && route_name == 'Home'"
    target="_blank"
    :href="'https://api.whatsapp.com/send?phone='+commerce.phone"
	:class="scroll_bottom ? 'btn-whats-app-active' : ''"
	class="btn-whats-app s">
		<i class="icon-whatsapp"></i>
	</a>
</template>
<script>
export default {
	data() {
		return {
			scroll: 0,
			scroll_bottom: false,
		}
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
}
</script>
<style lang="sass">
.btn-whats-app
	position: fixed
	bottom: 180px
	left: 0
	transform: translateX(100vw)
	background: #25D366
	border-radius: 50%
	width: 50px
	height: 50px
	display: flex
	justify-content: center
	align-items: center
	transition: all .3s
	i 
		font-size: 25px
		color: #FFF
		&::before
			margin: 0
			padding: 0
.btn-whats-app-active
	@media screen and (max-width: 992px)
		transform: translateX(calc(100vw - 75px))
	@media screen and (min-width: 992px)
		transform: translateX(calc(100vw - 100px))
</style>