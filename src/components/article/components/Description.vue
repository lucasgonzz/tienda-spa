<template>
	<!-- <b-row
	v-if="article && (article.descriptions && article.descriptions.length)"
	class="j-xl-start">
		<b-col
		cols="12"
		md="11"
		lg="10"
		xl="8"> -->
			<div 
			v-if="article && (article.descriptions && article.descriptions.length)"
			class="descriptions m-b-15">
				<div
				v-if="article && article.descriptions && article.descriptions.length">
					<h5
					:class="m_t"
					class="text-left">
						Descripcion
					</h5>
					<div 
					v-for="description in article.descriptions"
					class="description">
						<p
						class="title">
							{{ description.title }}
						</p>
						<p
						class="text-left">
							{{ description.content}}
						</p>
					</div>
				</div>
			</div>
		<!-- </b-col>
	</b-row> -->
</template>
<script>
export default {
	computed: {
		article() {
			return this.$store.state.articles.article_to_show
		},
		m_t() {
			if (this.article.colors.length) {
				return 'm-t-20'
			}
		}
	}
}
</script>
<style lang="sass">
.descriptions
	.description
		.title 
			font-size: 1em
			font-weight: bold 
			margin-bottom: 0 
</style>