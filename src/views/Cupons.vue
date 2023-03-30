<template>
	<div class="view">
		<b-row>
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
					<cupons-list></cupons-list>
				</b-skeleton-wrapper>
			</b-col>
		</b-row>
	</div>
</template>
<script>
import ArticleCardSkeleton from '@/components/common/ArticleCardSkeleton'
import CuponsList from '@/components/cupons/components/CuponsList'
export default {
	name: 'Cupons',
	components: {
		ArticleCardSkeleton,
		CuponsList,
	},
	computed: {
		loading() {
			return this.$store.state.cupons.loading
		},
	},
	created() {
		this.setTitle('Cupones')
		this.$store.dispatch('cupons/setCuponsRead')
		this.$store.commit('cupons/setCuponsRead')
		this.$store.commit('cupons/setCuponsNotRead')
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