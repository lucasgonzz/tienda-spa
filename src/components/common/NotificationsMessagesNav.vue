<template>
	<b-row
	class="row-notifications">
		<b-col>
			<div class="notifications-messages-nav">
				<div class="item item-active">
					Notificaciones
				</div>
				<div 
				@click="toMessages()"
				class="item">
					Mensajes
				</div>
			</div>
		</b-col>
	</b-row>
</template>
<script>
import nav from '@/mixins/nav'
export default {
	mixins: [nav],
}
</script>
<style lang="sass">
.row-notifications
	margin-top: -15px !important
	.col
		padding: 0
.notifications-messages-nav
	display: flex
	background: #FFF
	.item 
		width: 50%
		padding: .5em
		border-bottom: .15em solid rgba(51,51,51,.5)
	.item-active
		border-bottom: .15em solid rgba(51,51,51,.9)
		font-weight: bold
</style>