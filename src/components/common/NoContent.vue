<template>
	<div>
		<p class="not-results">
			<i class="bi bi-inbox no-content__icon"></i>
		</p>
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
.no-content__icon
	font-size: 3em
</style>