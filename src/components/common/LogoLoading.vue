<template>
	<div
	v-if="loading"
	class="container-logo">
		<img 
		src="@/assets/icon.png" alt="">
        <b-spinner variant="success"></b-spinner>
        <p
        class="text-success">
        	{{ message }}
        </p>
	</div> 
</template>
<script>
export default {
	computed: {
		loading() {
			return this.$store.state.auth.loading
		},
		message() {
			return this.$store.state.auth.message
		},
	}
}
</script>
<style scoped lang="sass">
@import '@/sass/_custom'
.container-logo
	@if ($theme == dark) 
		background: rgba(0, 0, 0, 9)
	@else if ($theme == ligth) 
		background: #FFF
	position: fixed
	width: 100vw
	height: 100vh
	z-index: 1000
	display: flex
	flex-direction: column
	justify-content: center
	align-items: center
	img 
		width: 90px
		margin-bottom: 8px
	.spinner-border 
		width: 25px
		height: 25px
	p 
		margin-top: 10px
		font-weight: bold
</style>