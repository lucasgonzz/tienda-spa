<template>
	<b-button 
	v-if="!authenticated"
	@click="toLogin"
	class="btn-nav btn-login m-r-15">
		Iniciar sesion
	</b-button>
</template>
<script>
import nav from '@/mixins/nav'
export default {
	name: 'BtnLogin',
	mixins: [nav],
}
</script>