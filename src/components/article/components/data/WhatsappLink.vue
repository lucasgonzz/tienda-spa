<template>
	<a
	class="article-action-link"
	target="_blank"
	rel="noopener noreferrer"
	:href="'https://api.whatsapp.com/send?phone=' + commerce.phone">
		<i class="bi bi-whatsapp" aria-hidden="true"></i>
		<span>Consultar</span>
	</a>
</template>
<script>
export default {
	name: 'WhatsappLink',
}
</script>
<style scoped lang="sass">
@import '@/sass/_article_action_link'
</style>
