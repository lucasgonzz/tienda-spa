<template>
	<div
	v-if="loading"
	class="container-logo">
		<img 
		src="@/assets/icon.png" alt="">
        
        <b-spinner 
        v-if="!there_is_update"
        variant="success"></b-spinner>
		<b-progress 
		v-else
		variant="success" :value="progress" :max="100" show-progress animated></b-progress>

        <p>
        	{{ message }}
        </p>
	</div> 
</template>
<script>
import update_app from '@/mixins/update_app'
export default {
	mixins: [update_app],
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
	.progress 
		width: 200px
	p 
		margin-top: 10px
		font-weight: bold
		color: $color_text
</style>