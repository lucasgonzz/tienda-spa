<template>
	<div
	class="m-t--15"
	v-show="search_query.length <= 2 && user">
		<div
		v-if="last_searchs.length">
			<b-list-group
			class="no-separate-items no-shadow-items">
				<b-list-group-item
				class="text-left"
				@click="setSearch(last_search)"
				v-for="last_search in last_searchs"
				:key="last_search.id">
					<i class="icon-clock m-r-10"></i>
					{{ last_search.body }}
				</b-list-group-item>
			</b-list-group>
		</div>
	</div>
</template>
<script>
import search from '@/mixins/search'
export default {
	mixins: [search],
	computed: {
		last_searchs_() {
			return this.$store.state.last_searchs.last_searchs
		},
		last_searchs() {
			let res = this.last_searchs_.filter(last => {
				return last.body.toLowerCase().includes(this.search_query.toLowerCase())
			})
			let array = []
			res.forEach(last => {
				array.push({id: last.id, body: last.body, is_last_search: true})
			})
			return array
		}
	},
	methods: {
		setSearch(last_search) {
			this.$store.commit('categories/setSearchQuery', last_search.body)
			this.searchArticle()
		}
	}
}
</script>