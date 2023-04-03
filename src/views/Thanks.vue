<template>
	<div class="view">
		<b-row>
			<b-col
			md="5"
			lg="4"
			cols="12">
				<div class="cont-center">
					<div
					class="shadow b-w p-15 b-r-1">
						<h4 class="text-with-icon text-success">
							<i class="icon-check"></i>
							Recibimos tu pedido.
						</h4>
						<h4 class="text-success">
							¡Gracias por tu compra!
						</h4>
						<p class="text-success">
							<strong>
								Nos pondremos en contacto con vos via email o via WhatsApp.
							</strong>
						</p>
						<b-button
						:to="{name: 'Home'}"
						block
						variant="success">
							Volver al Inicio
						</b-button>
					</div>
				</div>
			</b-col>
			<!-- <order-phone></order-phone> -->
		</b-row>
	</div>
</template>
<script>
import OrderPhone from '@/components/home/components/OrderPhone'
import firebase from '@/mixins/firebase'
export default {
	mixins: [firebase],
	components: {
		OrderPhone,
	},
    metaInfo: {
        title: 'Gracias por tu compra',
    },
	created() {
		this.setTitle('Gracias por tu compra')
		// setTimeout(() => {
		// 	this.checkNotificationsPermissions()
		// }, 5000)
	}
}	
</script>