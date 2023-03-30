<template>
	<div 
	class="platelet model shadow-1 b-r-1 m-b-5">
		<p 
		class="name">
			{{ platelet.name }}
		</p>
		<p 
		class="description">
			{{ platelet.description }}
		</p>
	</div>
</template>
<script>
export default {
	props: ['platelet'],
}
</script>
<style lang="sass">
.platelet 
	max-width: 400px	
	margin: auto
	padding: 1em
	.name 
		font-weight: bold
		font-size: 1.2em
	.description
		text-align: center
		font-size: 1em
</style>