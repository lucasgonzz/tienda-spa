<template>
<div class="view">
	<b-row>
		<b-col>
			<h2
			class="title m-t-40 m-b-40">
				Promociones
			</h2>

			<div class="cont-models">
				<article-card
				v-for="article in promociones"
				:key="article.id"
				:article="article"></article-card>
			</div>

		</b-col>
	</b-row>
</div>
</template>
<script>
export default {
	components: {
		ArticleCard: () => import('@/components/common/article-card/Index'),
	},
	computed: {
		promociones() {
			return this.$store.state.categories.promociones_vinoteca
		},
	},
	// created() {
	// 	this.getArticles()
	// },
	// methods: {
	// 	getArticles() {
	// 		this.loading = true
	// 		this.$api.get('articles-seleccion-especial/'+this.$route.params.articles_id) 
	// 		.then(res => {
	// 			this.loading = false
	// 			this.articles_seleccion = res.data.models 
	// 		})
	// 		.catch(err => {
	// 			this.loading = false
	// 			console.log(err)
	// 		})
	// 	}
	// }
}
</script>