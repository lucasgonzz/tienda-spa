<template>
	<div class="checkout-section">
		<h2 class="checkout-section__title">
			<i class="bi bi-box-seam"></i>
			¿Cómo lo recibís?
		</h2>

		<div
		role="radiogroup"
		aria-label="Forma de entrega">
			<div
			v-for="deliver_option in deliver_options"
			:key="deliver_option.value"
			@click="deliver = deliver_option.value"
			@keyup.enter="deliver = deliver_option.value"
			@keyup.space="deliver = deliver_option.value"
			:class="{'checkout-option--selected': deliver === deliver_option.value}"
			class="checkout-option"
			role="radio"
			tabindex="0"
			:aria-checked="deliver === deliver_option.value ? 'true' : 'false'">

				<span class="checkout-option__radio"></span>

				<i
				:class="deliver_option.icon"
				class="checkout-option__icon"></i>

				<div class="checkout-option__body">
					<p class="checkout-option__name">
						{{ deliver_option.name }}
					</p>
					<p class="checkout-option__description">
						{{ deliver_option.description }}
					</p>
				</div>
			</div>
		</div>
	</div>
</template>
<script>
export default {
	computed: {
		deliver_options() {
			let options = []
			if (this.flag_activo(this.commerce.online_configuration.has_delivery)) {
				options.push({
					name: 'Envío a domicilio',
					description: 'Te lo llevamos a la dirección que nos indiques.',
					icon: 'bi bi-truck',
					value: 1,
				})
			}
			if (this.flag_activo(this.commerce.online_configuration.retiro_por_local)) {
				options.push({
					name: 'Retiro por el local',
					description: 'Pasás a buscarlo cuando esté listo. Sin costo de envío.',
					icon: 'bi bi-shop',
					value: 0,
				})
			}
			return options
		},
		deliver: {
			get() {
				return this.$store.state.cart.cart.deliver
			},
			set(value) {
				this.$store.commit('cart/setDeliver', value)
			}
		}
	}
}
</script>
