<template>
<div class="view">
	<!-- Modal global de agregar al carrito (requerido por article-card / BtnMasInfo) -->
	<add-to-cart-modal></add-to-cart-modal>

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
		AddToCartModal: () => import('@/components/common/add-to-cart-modal/Index'),
	},
	computed: {
		title() {
			let title = ''
			if (this.user) {
				title = 'Hola '+this.user.name+', '
			}
			// Sin `company_name` (la tienda de demo no lo tiene cargado) el saludo decia "null armo
			// esta seleccion...". Se cae al nombre del comercio y, si tampoco hay, va sin nombre.
			let nombre = [this.commerce.company_name, this.commerce.name]
				.map(valor => String(valor || '').trim())
				.find(valor => valor !== '') || ''
			if (nombre) {
				title += nombre+' armo esta seleccion de articulos para vos'
			} else if (title) {
				title += 'armamos esta seleccion de articulos para vos'
			} else {
				title = 'Armamos esta seleccion de articulos para vos'
			}
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