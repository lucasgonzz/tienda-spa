<template>
<div class="view">
	<b-row>
		<b-col>
			<h2
			class="title">
				{{ title }}
			</h2>

			<div class="cont-models">
				<article-card
				v-for="article in articles_seleccion"
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
		title() {
			let title = ''
			if (this.user) {
				title = 'Hola '+this.user.name+', '
			} 
			title += this.commerce.company_name+' armo esta seleccion de articulos para vos'
			return title
		}
	},
	data() {
		return {
			articles_seleccion: [],
			loading: false,
		}
	},
	created() {
		this.getArticles()
	},
	methods: {
		getArticles() {
			this.loading = true
			this.$api.get('articles-seleccion-especial/'+this.$route.params.articles_id) 
			.then(res => {
				this.loading = false
				this.articles_seleccion = res.data.models 
			})
			.catch(err => {
				this.loading = false
				console.log(err)
			})
		}
	}
}
</script>