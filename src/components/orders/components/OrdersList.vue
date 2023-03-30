<template>
	<b-skeleton-wrapper :loading="loading">
		<template v-slot:loading>
			<order-skeleton
			v-for="i in 3"
			:key="i"></order-skeleton>
		</template>
		<div>
			<div
			v-if="orders.length">
				<h1 class="title">
					Compras
				</h1>
				<div
				v-for="order in orders"
				:key="order.id"
				@click="showOrderDetails(order)">
					<order-component
					:order="order"></order-component>
				</div>
				<infinite-loading 
				spinner="spiral"
				@infinite="infiniteHandler">
					<div slot="no-more">
						<div class="not-resutls">
							No tienes mas compras
						</div>
					</div>
					<div slot="no-results">
					</div>
				</infinite-loading>
			</div>
			<p 
			v-else
			class="text-with-icon">
				<i class="icon-bag-o"></i>
				No tienes ninguna compra
			</p>
		</div>
	</b-skeleton-wrapper>
</template>
<script>
import OrderComponent from '@/components/orders/components/OrderComponent'
import OrderSkeleton from '@/components/orders/components/OrderSkeleton'
import InfiniteLoading from 'vue-infinite-loading'
export default {
	name: 'OrdersList',
	components: {
		OrderComponent,
		OrderSkeleton,
		InfiniteLoading,
	},
	computed: {
		loading() {
			return this.$store.state.orders.loading
		},
		orders() {
			return this.$store.state.orders.orders
		}
	},
	methods: {
		showOrderDetails(order) {
			console.log(order)
			this.$store.commit('orders/setDetails', order)
			this.$bvModal.show('order-details')
		},
		infiniteHandler($state) {
			if (this.orders.length >= 6 && this.hasMore(this.orders)) {
				this.$api.get(`/orders?page=${this.page}`)
				.then(res => {
					let orders = res.data.orders.data
					if (orders.length) {
						this.$store.commit('orders/addOrders', orders)
						this.$store.commit('orders/incrementPage')
						$state.loaded()
					} else {
						$state.complete()
					}
				})
			} else {
				$state.complete()
			}
		}
	}
}
</script>