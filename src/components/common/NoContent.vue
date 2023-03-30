<template>
	<div>
		<p class="icon-cancel not-results"></p>
		<p
		class="not-results">
			{{ text }}
		</p>
	</div>
</template>
<script>
export default {
	name: 'NoContent',
	props: ['text']
}
</script>
<style lang="sass">
.icon-cancel
	font-size: 3em
</style>