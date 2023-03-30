<template>
	<div class="view">
		<cards></cards>
	</div>
</template>
<script>
import Cards from '@/components/cards/components/Cards'
export default {
	components: {
		Cards
	},
	created() {
		this.setTitle('Tarjetas')
	}
}	
</script>