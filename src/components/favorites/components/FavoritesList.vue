<template>
	<div>
		<div
		v-if="articles.length">
			<h1 class="title">
				Favoritos
			</h1>
			<div class="cont-models">
				<article-card
				v-for="article in articles"
				:key="article.id"
				:article="article"></article-card>
				<infinite-loading 
				spinner="spiral"
				@infinite="infiniteHandler">
					<div slot="no-more">
						<p class="not-results">
							No tienes mas favoritos
						</p>
					</div>
					<div slot="no-results">
					</div>
				</infinite-loading>
			</div>
		</div>
		<div
		v-else
		class="text-with-icon">
			<i class="icon-heart"></i>
			No tienes ningun favorito
		</div>
	</div>
</template>
<script>
import InfiniteLoading from 'vue-infinite-loading'
import ArticleCard from '@/components/common/ArticleCard'
export default {
	components: {
		ArticleCard,
		InfiniteLoading
	},
	computed: {
		articles() {
			return this.$store.state.favorites.favorites
		},
		page() {
			return this.$store.state.favorites.page
		}
	},
	methods: {
		infiniteHandler($state) {
			if (this.articles.length && this.articles.length % 6 == 0) {
				let url = `/favorites?page=${this.page}`
				console.log(url)
				this.$api.get(url)
				.then(res => {
					let articles = res.data.articles.data
					if (articles.length) {
						this.$store.commit('favorites/incrementPage')
						this.$store.commit('favorites/addFavorites', articles)
						$state.loaded()
					} else {
						$state.complete()
					}
				})
			} else {
				$state.complete()
			}
		}
	}
}
</script>