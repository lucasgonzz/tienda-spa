<template>
	<div
	class="model article-card shadow"
	no-body>
		<div 
		class="vue-load-image d-sm-none">
			<b-skeleton-img 
			height="90px"></b-skeleton-img>
		</div>
		<div 
		class="vue-load-image d-none d-sm-block">
			<b-skeleton-img 
			height="250px"></b-skeleton-img>
		</div>
		<div class="card-article-body">
			<b-skeleton width="30%" class="m-b-10"></b-skeleton>
			<b-skeleton width="80%" class="m-b-15"></b-skeleton>
			<b-skeleton type="button" width="100%"></b-skeleton>
		</div>
	</div>
</template>
<script>
export default {
	computed: {
		height() {
			if (this.is_mobile) {
				return '90px'
			}
			return '250px'
		}
	}
}
</script>