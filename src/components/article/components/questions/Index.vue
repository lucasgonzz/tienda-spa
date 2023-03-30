<template>
	<b-row
	class="j-xl-start m-b-25">
		<b-col
		cols="12"
		md="11"
		lg="10"
		xl="8">
			<spinner
			v-show="loading_questions"></spinner>
			<b-card
			v-if="!loading_questions && article && article.questions.length"
			class="b-r-not-sm shadow-2">
				<h5 class="text-left">Preguntas</h5>
				<hr class="m-t-0">
				<conversaciones></conversaciones>
			</b-card>
		</b-col>
	</b-row>
</template>
<script>
import Spinner from '@/components/common/Spinner'
import Conversaciones from '@/components/article/components/questions/Conversaciones'
export default {
	name: 'PreguntasIndex',
	components: {
		Spinner,
		Conversaciones,
	},
	computed: {
		article() {
			return this.$store.state.articles.article_to_show
		},
		loading_questions() {
			return this.$store.state.articles.loading_questions
		},
	}
}
</script>
<style scoped lang="sass">
.form-control
	width: 100%
	margin-bottom: .5em
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