<template>
	<div
	v-if="commerce.online_configuration.enviar_whatsapp_al_terminar_pedido"
	class="whats-app-info">
		<p>
			<strong>Importante:</strong> Luego de finalizar tu pedido, te vamos a pedir que nos envies un WhatsApp con el resumen del mismo.
		</p>
		<p>
			No tenes que escribir nada en particular, solo tenes que darle al boton de enviar.
		</p>
		<hr>
	</div>
</template>
<style lang="sass">
.whats-app-info
	margin: 25px 0
	p  
		font-size: 18px
		text-align: left
</style>