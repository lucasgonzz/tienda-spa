<template>
	<router-link
	v-if="authenticated"
	class="btn-nav btn-messages apretable m-l-15"
	:to="{name: 'Messages'}">
		<b-badge
		v-show="messages_not_read > 0"
		class="badge"
		variant="danger"
		size="sm">
			{{ messages_not_read }}
		</b-badge>
		<i :class="getIconActive('Messages', 'send')"></i>
	</router-link>
</template>
<script>
import nav from '@/mixins/nav'
export default {
	mixins: [nav],
}
</script>
<style lang="sass">
.btn-messages
	display: flex
	align-items: center
</style>