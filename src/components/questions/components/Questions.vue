<template>
	<b-skeleton-wrapper :loading="loading">
		<template v-slot:loading>
			<div class="cont-models">
				<article-card-skeleton
				v-for="i in 3"
				:key="i"></article-card-skeleton>
			</div>
		</template>
		<div>
			<p 
			v-if="!questions.length"
			class="text-with-icon">
				<i class="icon-comment"></i>
				No has hecho preguntas
			</p>
			<div
			v-else>
				<h1 class="title">
					Preguntas
				</h1>
				<div class="cont-models">
					<router-link
					v-for="question in questions"
					:key="question.id"
					:to="{name: 'Article', params: {slug: question.article.slug}}">
						<article-questions
						:question="question"></article-questions>
					</router-link>
					<infinite-loading 
					spinner="spiral"
					@infinite="infiniteHandler">
						<div slot="no-more">
							No hay mas preguntas
						</div>
						<div slot="no-results">
						</div>
					</infinite-loading>
				</div>
			</div>
		</div>
	</b-skeleton-wrapper>
</template>
<script> 
import ArticleQuestions from '@/components/questions/components/ArticleQuestions'
import ArticleCardSkeleton from '@/components/common/ArticleCardSkeleton'
import InfiniteLoading from 'vue-infinite-loading'
export default {
	name: 'QuestionsList',
	components: {
		ArticleQuestions,
		ArticleCardSkeleton,
		InfiniteLoading
	},
	computed: {
		loading() {
			return this.$store.state.questions.loading
		},
		questions() {
			return this.$store.state.questions.questions
		},
		authenticated() {
			return this.$store.state.auth.authenticated
		},
		page() {
			return this.$store.state.questions.page
		}
	},
	methods: {
		infiniteHandler($state) {
			if (this.questions.length >= 6) {
				this.$store.commit('questions/incrementPage')
				let url = `/questions?page=${this.page}`
				this.$api.get(url)
				.then(res => {
					let questions = res.data.questions.data
					if (questions.length) {
						this.$store.commit('questions/addQuestions', questions)
						$state.loaded()
					} else {
						$state.complete()
					}
				})
			} else {
				$state.complete()
			}
		}
	}
}
</script>