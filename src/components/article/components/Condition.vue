<template>
	<div
	v-if="article_to_show.condition_id"
	class="m-t-10">
		<p
		class="text-left m-b-5">
			<strong>
				{{ article_to_show.condition.name }}
			</strong>
		</p>
		<p
		class="text-left">
			{{ article_to_show.condition.description }}
		</p>
	</div>
</template>
<script>
export default {
	computed: {
	},
	methods: {
		isCondition(condition) {
			if (this.article_to_show.condition_id && this.article_to_show.condition_id == condition.id) {
				return ' condition-selected bg-success'
			}
			return 'condition-not-selected'
		}
	}
}
</script>
<style lang="sass">
.conditions 
	display: flex
.condition
	// border: 1.5px solid rgba(0,0,0,.7)
	border-radius: 1em
	padding: .5em 1em
	margin-right: 1em
.condition-selected
	font-weight: bold
	color: #FFF
.condition-not-selected
	font-weight: 600
	color: rgba(0,0,0,.5)
</style>