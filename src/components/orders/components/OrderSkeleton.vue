<template>
	<b-card
	class="card-compra shadow-2 b-r"
	no-body>
		<div class="card-compra-body">
			<b-skeleton width="20%"></b-skeleton>
			<b-skeleton width="50%"></b-skeleton>
			<b-skeleton width="50%"></b-skeleton>
		</div>
	</b-card>
</template>
<style scoped lang="sass">
.card-compra 
	cursor: pointer
	margin-bottom: 1em
	.card-compra-body
		padding: 1em
		display: flex
		flex-direction: column
		align-items: flex-start
		p 
			margin-bottom: 1em
			&:last-child
				margin-bottom: 0
		.total-order 
			font-weight: bold
			margin-bottom: 0
		.since 
			width: 100%
			color: rgba(0,0,0,.7)
			text-align: right

</style>
