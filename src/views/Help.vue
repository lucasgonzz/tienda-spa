<template>
	<div class="view">
		<options></options>
		<writte></writte>
		<call></call>
	</div>
</template>
<script>
import Options from '@/components/help/components/Options'
import Writte from '@/components/help/components/Writte'
import Call from '@/components/help/components/Call'
export default {
	components: {
		Options,
		Writte,
		Call,
	},
	created() {
		this.setTitle('Ayuda')
		console.log(this.$route.params.selected_option)
	}
}	
</script>