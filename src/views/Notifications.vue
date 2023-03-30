<template>
	<div class="view">
		<!-- <notifications-messages-nav></notifications-messages-nav> -->
		<b-row>
			<b-col
			cols="12"
			md="6">
				<div 
				v-show="!notifications_length && !loading">
					<!-- <h1 
					class="title title-color">
						Notificaciones
					</h1> -->
					<p class="no-content title-color">
						<i class="icon-notification-o"></i>
						No tienes notificaciones
					</p>
				</div>
				<list></list>
			</b-col>
		</b-row>
	</div>
</template>
<script>
import List from '@/components/notifications/components/List'
import NotificationsMessagesNav from '@/components/common/NotificationsMessagesNav'
import notifications from '@/mixins/notifications'
export default {
	name: 'Notifications',
	components: {
		List,
		NotificationsMessagesNav,
	},
	mixins: [notifications],
	beforeRouteLeave(to, from, next) {
		this.$store.dispatch('notifications/markAsRead')
		this.$store.commit('notifications/markAsRead')
		this.$store.commit('notifications/setUnreadNotificationsCount', true)
		next()
	},
	created() {
		this.$store.commit('notifications/setUnreadNotificationsCount', true)
		this.setTitle()
	},
}
</script>