<template>
	<div 
	v-if="authenticated"
	class="m-l-15 message-btn c-p apretable"
	:class="active('Messages')"
	@click="toMessages">
		<span
		class="d-none d-lg-block">
			Mensajes
		</span>
		<span
		class="d-lg-none">
			<i class="icon-send"></i>
		</span>
		<b-badge
		class="m-l-5"
		v-show="messages_not_read > 0"
		variant="danger">
			{{ messages_not_read }}
		</b-badge>
	</div>	
</template>
<script>
import nav from '@/mixins/nav'
export default {
	mixins: [nav],	
}
</script>
<style lang="sass">
.message-btn 
	display: flex
	flex-direction: row 
	align-items: center 
	i 
		font-size: 1.2em
</style>