<template>
	<div>
		<div>
			<div
			v-if="!loading_categories"
			class="cont_2_6">
				<div 
				v-for="category in categories"
				:class="isSelectedCategory(category)"
				@click="setSelectedCategory(category)"
				class="model category s b-r c-p apretable">
					<p>
						{{ category.name | first_upper }}
					</p>
				</div>
			</div>
			<div 
			v-else
			class="cont_2_6">
				<div 
				class="model category category-skeleton s b-r m-r-10"
				v-for="i in 6"
				:key="i">
					<b-skeleton width="100px"></b-skeleton>
				</div>
			</div>
		</div>
	</div>
</template>
<script>
import categories from '@/mixins/categories'
export default {
	mixins: [categories],
}
</script>
