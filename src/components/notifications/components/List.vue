<template>
	<div>
		<loading
		v-if="loading"></loading>
		<div
		v-else>
			<div
			v-show="unread_notifications.length">
				<div class="title text-left">
					Nuevas
				</div>
				<b-list-group>
					<b-list-group-item
					:class="isQuestionAnswered(notification) ? 'c-p' : ''"
					@click="clickNotification(notification)"
					class="shadow-3"
					v-for="notification in unread_notifications"
					:key="notification.id">
						<notification-data
						:notification="notification"></notification-data>
					</b-list-group-item>
				</b-list-group>
			</div>
			<div
			v-show="notifications.length">
				<div class="title text-left">
					Leidas
				</div>
				<b-list-group>
					<b-list-group-item
					:class="isQuestionAnswered(notification) ? 'c-p' : ''"
					@click="clickNotification(notification)"
					v-for="notification in notifications"
					:key="notification.id">
						<notification-data
						:notification="notification"></notification-data>
					</b-list-group-item>
					<infinite-loading 
					spinner="spiral"
					@infinite="infiniteHandler">
						<div slot="no-more">
							<div class="not-resutls">
								No tienes mas notificationes
							</div>
						</div>
						<div slot="no-results">
						</div>
					</infinite-loading>
				</b-list-group>
			</div>
		</div>
	</div>
</template>
<script>
import notifications from '@/mixins/notifications'
import Loading from '@/components/notifications/components/Loading'
import NotificationData from '@/components/notifications/components/NotificationData'
import InfiniteLoading from 'vue-infinite-loading'
export default {
	name: 'NotificationsList',
	mixins: [notifications],
	components: {
		Loading,
		NotificationData,
		InfiniteLoading,
	},
	computed: {
		page() {
			return this.$store.state.notifications.page
		}
	},
	methods: {
		infiniteHandler($state) {
			if (this.notifications.length == 6) {
				this.$api.get(`/notifications?page=${this.page}`)
				.then(res => {
					let notifications = res.data.notifications.data
					if (notifications.length) {
						this.$store.commit('notifications/addNotifications', notifications)
						this.$store.commit('notifications/incrementPage')
						$state.loaded()
					} else {
						$state.complete()
					}
				})
			} else {
				$state.complete()
			}
		},
	}
}
</script>
