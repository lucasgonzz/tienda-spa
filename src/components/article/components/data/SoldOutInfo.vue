<template>
	<div
	v-if="article_to_show.stock != null && article_to_show.stock <= 0">
		<p 
		class="stock-0 text-danger m-b-10">
			Producto agotado
		</p>
		<div
		class="add-to-cart m-b-15">
			<b-button
			@click="addAdvise"
			variant="success"
			block>
				<btn-loader
				text="Avisarme cuando este disponible"
				:loader="loading"></btn-loader>
			</b-button>
		</div>
	</div>
</b-skeleton-wrapper>
</template>
<script>
import BtnLoader from '@/components/common/BtnLoader'
export default {
	name: 'SoldOutInfo',
	components: {
		BtnLoader,
	},
	data() {
		return {
			loading: false,
		}
	},
	methods: {
		addAdvise() {
			if (!this.authenticated) {
				this.$bvModal.show('advise')
			} else {
				this.loading = true
				this.$api.post('advises', {
					article_id: this.article_to_show.id,
					email: this.user.email
				})
				.then(res => {
					this.loading = false 
					this.$toast.success('Te avisaremos cuando este disponible')
					this.$bvModal.hide('advise')
				})
				.catch(err => {
					this.loading = false 
					console.log(err)
				})
			}
		},
	}
}
</script>
<style scoped lang="sass">
.stock-0 
	text-align: left
	margin: 1em 0 0
	font-weight: 700
</style>