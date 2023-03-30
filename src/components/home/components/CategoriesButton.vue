<template>
	<b-button
	class="d-md-none m-b-15"
	v-show="show_button"
	:to="{name: 'Categories'}"
	block
	variant="success">
		Ver categorias
	</b-button>
</template>
<script>
export default {
	computed: {
		selected_category() {
			return this.$store.state.categories.selected_category
		},
		show_button() {
			return this.selected_category && this.selected_category.is_last_uploads
		}
	}
}
</script>