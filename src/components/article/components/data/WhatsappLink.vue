<template>
	<a 
	class="link-whatsapp"
    target="_blank"
    :href="'https://api.whatsapp.com/send?phone='+commerce.phone">
    	<strong>
			<i class="icon-whatsapp"></i>
			Cualquier duda consultala al instante!
    	</strong>
	</a>
</template>
<script>
export default {
	name: 'WhatsappLink',
}
</script>
<style scoped lang="sass">
@import '@/sass/_custom'
.link-whatsapp
	text-align: left !important
	display: block
	color: #3FBB6D	
	&:hover 
		font-weight: bold
</style>