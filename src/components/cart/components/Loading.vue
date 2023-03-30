<template>
	<div>
		<div class="cont-models">
			<b-card 
			v-for="i in 3"
			:key="i"
			class="shadow-3 b-r model"
			no-body>
				<b-skeleton-img width="100%" aspect="1"></b-skeleton-img>
				<div class="article-data-container p-15">
					<p class="article-name">
						<b-skeleton width="85%"></b-skeleton>
					</p>
					<p class="article-price">
						<b-skeleton width="65%"></b-skeleton>
					</p>
				</div>
			</b-card>
		</div>
	</div>
</template>
<script>
export default {
	name: 'CartLoading',
}
</script>