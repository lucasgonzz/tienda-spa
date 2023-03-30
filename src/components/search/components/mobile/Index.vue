<template>
	<b-col
	cols="12"
	class="p-0 d-lg-none">
		<last-searchs></last-searchs>
		<search-results></search-results>
	</b-col>
</template>
<script>
import LastSearchs from '@/components/search/components/mobile/LastSearchs'
import SearchResults from '@/components/search/components/mobile/SearchResults'
export default {
	name: 'Search',
	components: {
		LastSearchs,
		SearchResults,
	},
}
</script>