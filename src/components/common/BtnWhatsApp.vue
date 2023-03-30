<template>
	<a 
	v-if="commerce.phone && route_name == 'Home'"
    target="_blank"
    :href="'https://api.whatsapp.com/send?phone='+commerce.phone"
	class="btn-whats-app s">
		<i class="icon-whatsapp"></i>
	</a>
</template>
<style lang="sass">
.btn-whats-app
	position: fixed
	bottom: 180px
	right: 20px
	background: #25D366
	border-radius: 50%
	width: 50px
	height: 50px
	display: flex
	justify-content: center
	align-items: center
	i 
		font-size: 25px
		color: #FFF
		&::before
			margin: 0
			padding: 0
</style>