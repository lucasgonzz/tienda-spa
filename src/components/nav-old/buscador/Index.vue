<template>
	<div>
		<mobile
		class="buscador-mobile"
		v-if="isSearchView"></mobile>
		<desktop></desktop>
	</div>
</template>
<script>
import Mobile from '@/components/nav/buscador/Mobile'
import Desktop from '@/components/nav/buscador/Desktop'
import nav_mixin from '@/mixins/nav'
export default {
	mixins: [nav_mixin],
	components: {
		Mobile,
		Desktop
	}
}
</script>
<style lang="sass">
.buscador-mobile
	width: 80%
// .buscador-desktop
// 	width: 50%
</style>