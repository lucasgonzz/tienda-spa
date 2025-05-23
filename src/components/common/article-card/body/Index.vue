<template> 
	<div
	class="card-article-body">
		<brand
		:article="article"></brand>	

		<name
		:article="article"></name>

		<cantidad
		:article="article"></cantidad>

		<variant-info
		:article="article"></variant-info>

		<cantidad-order
		:article="article"></cantidad-order>

		<price
		:article="article"></price>

		<btn-mas-info
		:article="article"></btn-mas-info>

		<cart-info
		:article="article"></cart-info>
	</div>
</template>
<script>
export default {
	name: 'ArticleCardBody',
	props: {
		article: Object,
	},
	components: {
		Brand: () => import('@/components/common/article-card/body/Brand'),
		Name: () => import('@/components/common/article-card/body/Name'),
		Cantidad: () => import('@/components/common/article-card/body/Cantidad'),
		VariantInfo: () => import('@/components/common/article-card/body/VariantInfo'),
		CantidadOrder: () => import('@/components/common/article-card/body/CantidadOrder'),
		Price: () => import('@/components/common/article-card/body/Price'),
		BtnMasInfo: () => import('@/components/common/article-card/body/BtnMasInfo'),
		CartInfo: () => import('@/components/common/article-card/body/CartInfo'),
	},
}
</script>
 