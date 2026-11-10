<template> 
	<div 
	v-if="estado_stock"
	class="agotado"
	:class="{ 'agotado--consultar': estado_stock === 'Consultar' }">
		{{ estado_stock }}
	</div>
</template>
<script>
import articlesMixin from '@/mixins/articles'
export default {
	mixins: [articlesMixin],
	props: {
		article: Object,
	},
	computed: {
		estado_stock() {
			return this.estado_stock_tarjeta(this.article)
		},
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

.article-card .agotado.agotado--consultar
	background: #ffe2a9
	color: #422900
</style>
