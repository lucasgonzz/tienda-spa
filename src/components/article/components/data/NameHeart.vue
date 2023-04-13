<template>
	<div 
	class="name-heart m-b-15">
		<p class="product-name">
			{{ article_to_show.name }}
		</p>
		<!-- <span 
		@click="favorite"
		:class="classHeart()"></span> -->
	</div>
</template>
<script>
export default {
	name: 'NameHeart',
	methods: {
		classHeart() {
			if (this.article_to_show.is_favorite) {
				return 'icon-heart text-danger'
			}
			return 'icon-heart-o text-danger'
		},
		favorite() {
			if (this.checkAuth()) {
				if (this.article_to_show.is_favorite) {
					this.$set(this.article_to_show, 'is_favorite', false)
				} else {
					this.$set(this.article_to_show, 'is_favorite', true)
				}
				this.$api.get(`/articles/favorite/${this.article_to_show.id}`)
				.then(() => {
					this.$store.dispatch('favorites/getFavorites')
					this.$store.commit('favorites/setPage', 2)
				})
				.catch(err => {
					this.$toast.error('Error al añadir a favoritos')
					console.log(err)
				})
			} 
		},
	}
}
</script>
<style scoped lang="sass">
@import '@/sass/_custom'
.name-heart 
	display: flex
	justify-content: space-between
.product-name
	font-size: 1.2em
	font-weight: bold
	text-align: left
	margin-bottom: 0
.icon-heart, .icon-heart-o 
	font-size: 1.7em
	cursor: pointer
	transition: all .1s
	padding-left: 1em
	&:active
		transform: scale(1.1)
</style>