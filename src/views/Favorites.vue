<template>
	<b-row
	class="view">
		<b-col
		class="col-products"
		cols="12"
		md="10"
		xl="8">
			<b-skeleton-wrapper :loading="loading">
				<template v-slot:loading>
					<div class="cont-models">
						<article-card-skeleton
						v-for="i in 3"
						:key="i"></article-card-skeleton>
					</div>
				</template>
				<favorites-list></favorites-list>
			</b-skeleton-wrapper>
		</b-col>
	</b-row>
</template>
<script>
import ArticleCardSkeleton from '@/components/common/ArticleCardSkeleton'
import FavoritesList from '@/components/favorites/components/FavoritesList'
export default {
	name: 'Favorites',
	components: {
		ArticleCardSkeleton,
		FavoritesList,
	},
	computed: {
		loading() {
			return this.$store.state.favorites.loading
		},
	},
	created() {
		this.setTitle('Favoritos')
	}
}
</script>
<style scoped lang="sass">
.not-orders
	color: rgba(0,0,0,.6)
	margin-top: 3em
a 
	&:hover
		text-decoration: none
</style>