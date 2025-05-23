<template>
	<div
	class="info-ssl">
		<img 
		src="@/assets/ssl.png">
		<div>
			<p>
				COMPRA SEGURA
			</p>
			<p>
				100% PROTEGIDO
			</p>
		</div>
	</div>
</template>
<style lang="sass">
@import '@/sass/_custom'
.info-ssl
	display: flex
	flex-direction: row 
	align-items: center 
	position: absolute 
	right: 15px
	img 

		@media screen and (max-width: 768px)
			width: 35px	
		@media screen and (min-width: 768px)
			width: 50px

	p 
		margin-bottom: 0
		font-weight: bold 
		color: $color_text

		@media screen and (max-width: 768px)
			font-size: 9px
		@media screen and (min-width: 768px)
			font-size: 16px

</style>