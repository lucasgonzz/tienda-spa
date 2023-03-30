<template>
	<b-card
	class="categories"
	no-body>
		<div class="p-10">
			<categories-list></categories-list>
		</div>
	</b-card>
</template>
<script>
import CategoriesList from '@/components/categories/components/CategoriesList'
export default {
	name: 'Categories',
	components: {
		CategoriesList,
	},
}
</script>