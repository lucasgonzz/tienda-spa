<template> 
	<div 
	v-if="!hasStock(article)"
	class="agotado">
		Agotado
	</div>
</template>
<script>
import articlesMixin from '@/mixins/articles'
export default {
	mixins: [articlesMixin],
	props: {
		article: Object,
	},
}
</script>
<style lang="sass">
@import '@/sass/_custom'
.agotado
	position: absolute
	top: 0
	left: 0
	font-weight: bold 
	font-size: 16px
	border-radius: 4px 0 5px 0
	background: $red 
	color: #FFF
	z-index: 10
	padding: 5px 10px
</style>
 