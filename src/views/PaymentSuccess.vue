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
						<h4 class="text-with-icon text-success m-0">
							<i class="icon-check"></i>
							Recibimos tu pago
						</h4>
						<p class="text-success">
							<strong>
								Estamos actualizando la información del pago de tu pedido.
							</strong>
						</p>
						<p class="text-success">
							<strong>
								NO CIERRES ESTA VENTANA.
							</strong>
						</p>
						<b-progress variant="success" :value="progress" :max="100" show-progress animated></b-progress>
						<div
						class="m-t-15"
						v-if="cart_updated">
							<p>
								<strong>
									Información actualizada correctamente
								</strong>
							</p>
							<p>
								Seras redirigido en <strong>{{ redirect_time }}</strong>...
							</p>
						</div>
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
        title: 'Pago Exitoso',
    },
}	
</script>