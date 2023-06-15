<template>
	<div
	class="container-logo">
		<img 
		src="@/assets/icon.png" alt="">
        
        <p>
        	Nuestro sitio web se encuentra momentáneamente fuera de servicio
        </p>
        <p>
        	Estamos trabajando para brindarte un mejor servicio
        </p>
        <p>
        	Disculpe las molestias 
        </p>
	</div> 
</template>
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
</style>