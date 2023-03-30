<template>
	<span>
		<span 
		v-show="loader"
		class="spinner-border spinner-border-sm"></span>
		<span v-show="!loader && icon != ''">
			<i :class="'icon-'+icon"></i>
		</span>
		<span v-show="!loader && text != ''">
			{{ text }}
		</span>
	</span>
</template>
<script>
export default {
	props: ['loader', 'text', 'icon']
}
</script>
<style scoped lang="sass">
.spinner-border
	margin-bottom: .2em
	margin-right: .1em
</style>