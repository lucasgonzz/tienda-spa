<template>
	<!-- <b-row
	v-if="article"
	class="j-xl-start">
		<b-col
		cols="12"
		md="11"
		lg="10"
		xl="8"> -->
			<b-card
			class="b-r-1 s m-b-15">
				<b-form-group
				label="Has una pregunta y te responderemos a la brevedad.">
					<b-form-textarea
					v-model="form.text"
					@keydown.enter="ask"
					:placeholder="placeholder"></b-form-textarea>
				</b-form-group>
				<div class="j-end">
					<b-button
					block
					@click="ask"
					variant="success">
						<btn-loader
						text="Preguntar"
						:loader="loading">
						</btn-loader>
					</b-button>
				</div>
			</b-card>
		<!-- </b-col>
	</b-row> -->
</template>
<script>
import BtnLoader from '@/components/common/BtnLoader'
export default {
	name: 'Preguntar',
	components: {
		BtnLoader,
	},
	data() {
		return {
			loading: false,
		}
	},
	computed: {
		placeholder() {
			return 'Preguntar sobre '+this.article.name+' ...'
		},
		authenticated() {
			return this.$store.state.auth.authenticated
		},
		form() {
			return this.$store.state.articles.preguntar.form
		},
		article() {
			return this.$store.state.articles.article_to_show
		},
	},
	methods: {
		ask() {
			if (this.authenticated) {
				if (this.form.text != '') {
					this.loading = true
					this.$api.post('/questions', {
						text: 		 this.form.text,
						article:     this.article,
						commerce_id: process.env.VUE_APP_COMMERCE_ID
					})
					.then(res => {
						this.loading = false
						this.form.text = ''
						this.$store.dispatch('questions/getQuestions')
						this.$toast.success('Pregunta enviada')
						console.log(res)
					})
					.catch(err => {
						this.loading = false
						console.log(err)
					})
				} else {
					this.$toast.error('Primero escribe tu pregunta, por favor')
				}
			} else {
				this.$bvModal.show('login-required')
			}
		}
	}
}
</script>
<style scoped lang="sass">
@media screen and (min-width: 1200px)
	// .row 
	// 	justify-content: flex-start
@media screen and (min-width: 992px)
	.cont-form-groups
		display: flex
		justify-content: space-between
	.form-group-input
		margin-bottom: 0
		width: 70% !important
	.form-group-btn
		width: 25% !important
@media screen and (max-width: 992px)
	.form-group-input
		width: 100% !important
	.form-group-btn
		width: 100% !important
</style>