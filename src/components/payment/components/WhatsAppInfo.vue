<template>
	<div
	v-if="commerce && commerce.online_configuration && flag_activo(commerce.online_configuration.enviar_whatsapp_al_terminar_pedido)"
	class="whats-app-info">
		<i class="bi bi-whatsapp"></i>
		<div>
			<p>
				<strong>Al terminar te pedimos un WhatsApp con el resumen del pedido.</strong>
			</p>
			<p>
				No tenés que escribir nada: solo darle a enviar.
			</p>
		</div>
	</div>
</template>
<style lang="sass">
.whats-app-info
	display: flex
	align-items: flex-start
	gap: .7rem
	background: rgba(37, 211, 102, .1)
	border: 1px solid rgba(37, 211, 102, .35)
	border-radius: 12px
	padding: .85rem 1rem
	margin-bottom: 1rem

	i
		color: #128C7E
		font-size: 1.3rem
		line-height: 1.2

	p
		font-size: .88rem
		text-align: left
		margin: 0
		line-height: 1.45
		color: #1a1a1a
</style>
