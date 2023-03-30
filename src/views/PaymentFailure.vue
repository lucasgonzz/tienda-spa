<template>
	<div class="view">
		<b-row>
			<b-col
			md="5"
			lg="4"
			cols="12">
				<b-card
				class="shadow">
					<h4 class="text-with-icon text-success">
						<i class="icon-check"></i>
						No pudimos procesar tu pago
					</h4>
					<p class="text-success">
						MercadoPago no pudo realizar la transacción.
					</p>
					<p class="text-success">
						Prueba con escoger otro metodo de pago.
					</p>
					<b-button
					block
					:to="{name: 'Payment'}"
					variant="success">
						Cambiar metodo de pago
					</b-button>
				</b-card>
			</b-col>
		</b-row>
	</div>
</template>
<script>
export default {
    metaInfo: {
        title: 'Pago Exitoso',
    },
}	
</script>