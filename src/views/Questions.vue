<template>
	<div class="view">
		<b-row>
			<b-col
			cols="12"
			md="10"
			xl="8">
				<questions></questions>
			</b-col>
		</b-row>
	</div>
</template>
<script>
import Questions from '@/components/questions/components/Questions'
export default {
	name: 'QuestionsComponent',
	components: {
		Questions,
	},
	computed: {
		user() {
			return this.$store.state.auth.user
		},
		authenticated() {
			return this.$store.state.auth.authenticated
		}
	},
	created() {
		this.setTitle('Preguntas')
	}
}
</script>
<style scoped lang="sass">
.not-questions
	color: rgba(0,0,0,.6)
	margin-top: 3em
a 
	&:hover
		text-decoration: none
</style>