<template>
	<article-card
	:article="question.article"></article-card>
</template>
<script>
import ArticleCard from '@/components/common/ArticleCard'
export default {
	name: 'ArticleQuestions',
	props: ['question'],
	components: {
		ArticleCard
	},
}
</script>
<style scoped lang="sass">
.with-answer
	margin-bottom: 0
</style>