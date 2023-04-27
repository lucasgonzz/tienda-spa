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
							<i class="icon-eye"></i>
							Tu pago esta pendiente
						</h4>
						<p class="text-success">
							Es posible que MercadoPago este verificando tu información.
						</p>
						<p class="text-success">
							De todas formas, puedes continuar con tu pedido, nos pondremos en contacto ante cualquier eventualidad.
						</p>
						<p class="text-success">
							Estamos preperando tu pedido para ser enviado.
						</p>
						<p class="text-success">
							<strong>
								NO CIERRES ESTA VENTANA.
							</strong>
						</p>
						<b-progress variant="success" :value="progress" :max="100" show-progress animated></b-progress>
					</div>
				</div>
			</b-col>
		</b-row>
	</div>
</template>
<script>
import BtnLoader from '@/components/common/BtnLoader'

import payment from '@/mixins/payment'
export default {
	mixins: [payment],
	components: {
		BtnLoader,
	},
    metaInfo: {
        title: 'Pago Pendiente',
    },
}	
</script>