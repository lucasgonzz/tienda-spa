<template>
	<div 
	v-if="commerce_has_extencion('vinoteca') && (article_to_show.bodega || article_to_show.cepa)"
	class="cont-name m-b-15">
		<hr>
		<p
		v-if="puede_ver_precios() && article_to_show.presentacion"
		class="text-left m-b-5">
			Precio por unidad: <strong>{{ precio_por_unidad(article_to_show) }} </strong>
		</p>
		<p
		v-if="article_to_show.presentacion"
		class="text-left m-b-5">
			Presentacion: <strong>{{ article_to_show.presentacion }} unidades</strong>
		</p>
		<p 
		v-if="article_to_show.bodega"
		class="text-left m-b-5">
			Bodega: <strong>{{ article_to_show.bodega.name }}</strong>
		</p>
		<p 
		v-if="article_to_show.origen"
		class="text-left m-b-5">
			Origen: <strong>{{ article_to_show.origen }}</strong>
		</p>
		<p
		v-if="article_to_show.cepa"
		class="text-left m-b-5">
			Cepa: <strong>{{ article_to_show.cepa.name }}</strong>
		</p>
	</div>
</template>
<style scoped lang="sass">
@import '@/sass/_custom'
</style>