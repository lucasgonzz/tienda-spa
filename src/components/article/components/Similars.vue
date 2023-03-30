<template>
	<b-row
	v-if="articles.length"
	class="j-xl-start m-lg-b-0">
		<b-col
		cols="12"
		md="11"
		lg="10"
		xl="8">
			<p 
			class="title animate__animated animate__fadeIn">
				Articulos similares
			</p>
			<b-skeleton-wrapper :loading="loading_similars">
				<template v-slot:loading>
					<div class="cont-models">
						<article-card-skeleton
						v-for="i in 6"
						:key="i"></article-card-skeleton>
					</div>
				</template>
				<div>
					<div
					class="cont-models">
						<article-card
						v-for="article in articles"
						:key="article.id"
						:article="article"></article-card>

						<infinite-loading 
						spinner="spiral"
						@infinite="infiniteHandler">
							<div slot="no-more" class="not-results">
								<span>
									No hay mas artículos
								</span>
							</div>
							<div slot="no-results">
							</div>
						</infinite-loading>

					</div>
					<p
					class="text-with-icon m-b-15"
					v-if="!articles.length">
						<span class="icon-cancel"></span>
						No hay articulos similares
					</p>
				</div>
			</b-skeleton-wrapper>
		</b-col>
	</b-row>
</template>
<script>
import ArticleCard from '@/components/common/ArticleCard'
import ArticleCardSkeleton from '@/components/common/ArticleCardSkeleton'

import InfiniteLoading from 'vue-infinite-loading'
export default {
	components: {
		ArticleCard,
		ArticleCardSkeleton,

		InfiniteLoading,
	},
	data() {
		return {
			page: 1,
		}
	},
	computed: {
		articles() {
			return this.$store.state.articles.similars
		},
		loading_similars() {
			return this.$store.state.articles.loading_similars
		},
	},
	methods: {
		infiniteHandler($state) {
			this.page++
			this.$api.get('articles/similars/'+this.article_to_show.id+'/'+process.env.VUE_APP_COMMERCE_ID+'?page='+this.page)
			.then(res => {
				console.log(res)
				let models = res.data.models.data
				if (models.length) {
					this.$store.commit('articles/addSimilars', models)
					$state.loaded()
				} else {
					$state.complete()
					console.log('complete')
				}
			})
			.catch(err => {
				console.log(err)
			})
		},
	}
}
</script>