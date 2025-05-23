<template>
	<div 
	v-if="show"
	class="descriptions m-b-15">
		<div
		class="card">
			<h5
			class="header">
				Descripcion
			</h5>
			<div 
			v-for="description in article.descriptions"
			class="body description">
				<p
				class="title">
					{{ description.title }}
				</p>
				<p
				v-html="descripcionConSaltos(description.content)"></p>
			</div>
			<div 
			v-if="article.description"
			class="body description">
				<p
				v-html="descripcionConSaltos(article.description)"></p>
			</div>
		</div>
	</div>
</template>
<script>
export default {
	computed: {
		article() {
			return this.$store.state.articles.article_to_show
		},
		show() {
			if (
				(this.article.descrptions && this.article.descrptions.length) 
				|| this.article.description
			) {
				return true
			}
			return false
		}
	},
	methods: {
		descripcionConSaltos(text) {
			return text.replace(/\n/g, '<br>');
		}
	}
}
</script>
<style lang="sass">
.descriptions
	background: #FFF
	border-radius: 10px
	border: 2px solid #DDDDDD
	.title 
		font-size: 1.2em
		font-weight: bold 
		margin: 10px 0
		text-align: left
</style>