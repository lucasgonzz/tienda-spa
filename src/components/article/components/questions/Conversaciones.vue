<template>
	<div 
	class="conversaciones">
		<div
		class="conversacion"
		v-for="question in article.questions"
		:key="question.id">
			<p class="pregunta">
				{{ question.text }}
			</p>
			<p 
			class="respuesta">
				{{ question.answer.text }}
			</p>
			<p class="since">
				{{ since(question.answer.created_at) }}
			</p>
		</div>
	</div>
</template>
<script>
export default {
	name: 'Conversaciones',
	computed: {
		article() {
			return this.$store.state.articles.article_to_show
		}
	}
}
</script>
<style lang="sass">
.conversacion
	margin-bottom: 1em
	border-bottom: 1px solid rgba(0,0,0,.1)
	&:last-child
		margin-bottom: 0
		border-bottom: none
	p 
		margin-bottom: 0
.pregunta
	color: #000
	position: relative
	text-align: left
.respuesta
	position: relative
	left: 5%
	width: 95%
	text-align: right
	color: rgba(0,0,0,.7)
.since
	text-align: right
	font-size: .8em
	color: rgba(0,0,0,.7)
</style>