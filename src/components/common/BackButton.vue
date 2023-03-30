<template>
	<router-link
	class="m-r-10 btn-nav btn-back apretable"
	v-if="$routerHistory.hasPrevious()"
	:to="{ path: $routerHistory.previous().path }">
		<i class="icon-back"></i>
	</router-link>
</template>
<style lang="sass">
@import '@/sass/_custom'
.btn-back
	color: $green !important
</style>