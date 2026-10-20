<template>
	<!--
		El renglon "Nuevo" de la captura: discreto, arriba del nombre del articulo. El
		"+1000 vendidos" de al lado NO se agrega: ese dato no existe en el payload de la
		tienda y no se inventa.
	-->
	<p
	v-if="article_to_show.condition_id"
	class="condicion-articulo">
		{{ article_to_show.condition.name }}
	</p>
</template>
<script>
export default {
	name: 'Condition',
}
</script>
<style scoped lang="sass">
.condicion-articulo
	margin: 0 0 2px 0
	font-size: 14px
	line-height: 1.35
	color: rgba(0, 0, 0, .55)
</style>
