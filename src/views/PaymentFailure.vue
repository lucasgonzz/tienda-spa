<template>
	<div class="view">
		<b-row>
			<b-col
			md="5"
			lg="4"
			cols="12">
				<div class="cont-center">
					<div
					class="shadow-1 b-w b-r-1 p-15">
						<h4 class="text-with-icon text-success">
							<i class="icon-info"></i>
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
					</div>
				</div>
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