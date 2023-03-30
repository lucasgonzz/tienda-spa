<template>
	<div>
		<b-row
		class="view m-t--15">
			<b-col
			cols="12"
			class="p-0 d-lg-none">
				<mobile></mobile>
			</b-col>
			<b-col
			cols="12"
			xl="11">
				<last-searchs></last-searchs>
			</b-col>
		</b-row>
	</div>
</template>
<script>
import Mobile from '@/components/search/components/mobile/Index'
import LastSearchs from '@/components/search/components/LastSearchs' 
export default {
	name: 'Search',
	components: {
		Mobile,
		LastSearchs,
	},
}
</script>