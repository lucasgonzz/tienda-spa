<template>
	<div class="view">
		<b-row>
			<b-col
			md="5"
			lg="4"
			cols="12">
				<b-card
				class="shadow-1">
					<h4 class="text-with-icon text-success m-0">
						<i class="icon-check"></i>
						Recibimos tu pago
					</h4>
					<p class="text-success">
						Estamos preperando tu pedido para ser enviado.
					</p>
					<p class="text-success">
						<strong>
							NO CIERRES ESTA VENTANA.
						</strong>
					</p>
					<b-progress variant="success" :value="progress" :max="100" show-progress animated></b-progress>
				</b-card>
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
        title: 'Pago Exitoso',
    },
}	
</script>