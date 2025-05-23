<template>
	<b-row 
	class="m-b-0 m-xl-b-15">

		<category-info></category-info>

		<b-col
		cols="12"
		lg="10"
		:xl="row_xl_image">
			<article-image></article-image>
		</b-col>
		<b-col
		class="p-relative"
		cols="12"
		md="11"
		lg="10"
		:xl="row_xl_data">
			<article-data></article-data>
			<variants></variants>
		</b-col>
		<b-col
		cols="12"
		md="11"
		lg="10">
			<description></description>
		</b-col>
	</b-row>
</template>
<script>
export default {
	name: 'Article',
	components: {
		CategoryInfo: () => import('@/components/article/components/CategoryInfo'),
		ArticleImage: () => import('@/components/article/components/ArticleImage'),
		ArticleData: () => import('@/components/article/components/data/Index'),
		Variants: () => import('@/components/article/components/data/Variants'),
		Description: () => import('@/components/article/components/Description'),
	},
	computed: {
		// Si no estoy en view Article, muestro las columnas anchas "para el modal addToCart"
		row_xl_image() {
			if (this.$route.name == 'Article') {
				return 7
			}
			return 8
		},
		row_xl_data() {
			if (this.$route.name == 'Article') {
				return 3
			}
			return 4
		},
	}
}
</script>
<style scpoed lang="sass">
.row 
	justify-content: center
	margin-top: 1em
	margin-bottom: 1.5em
</style>