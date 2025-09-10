<template>
	<div class="view thanks">
		<b-row>
			<b-col
			md="8"
			cols="12">
				<div class="cont-center">
					<div
					class="shadow b-w p-15 b-r-1">
						<h4 class="text-with-icon">
							<i class="icon-check"></i>
							Recibimos tu pedido.
						</h4>
						<h4>
							¡Gracias por tu compra!
						</h4>
						<p>
							<strong>
								Nos pondremos en contacto con vos via email o via WhatsApp.
							</strong>
						</p>

						

						<b-button
						v-if="enviar_whatsapp && seconds_left > 0"
						block
						class="btn-whatsapp">
							<i class="icon-whatsapp"></i>
            				Enviando WhatsApp en <strong>{{ seconds_left }}</strong> segundos...
						</b-button>

						<b-button
						v-else
						:to="{name: 'Home'}"
						block
						class="w-100"
						variant="primary">
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
    computed: {
    	order() {
    		return this.$store.state.orders.order 
    	},
    	enviar_whatsapp() {
    		return this.commerce.online_configuration.enviar_whatsapp_al_terminar_pedido
    	},
    },
    data() {
    	return {
            seconds_left: 5,
            interval_id: null,
            whatsapp_link: '',
    	}
    },
	created() {
		this.setTitle('Gracias por tu compra')
		this.$scrollToTop()

		if (this.enviar_whatsapp) {

			this.interval_id = setInterval(() => {
	            this.seconds_left -= 1;

	            if (this.seconds_left === 0) {
	                clearInterval(this.interval_id);
					
					this.set_whatsapp_link()

		            this.try_open_link();
	                
	            }
	        }, 1000);
		}
	},
    beforeDestroy() {
        if (this.interval_id) {
            clearInterval(this.interval_id);
        }
    },
	methods: {
		set_whatsapp_link() {

		    // Obtener nombre del comprador
		    const buyer_name = this.order.buyer.name

		    // Construir el mensaje
		    // let message = `Nuevo pedido de: ${buyer_name}`;
		    let message = `*Pedido N° ${this.order.num}*\n\n`;
		    
		    message += `*Cliente: ${buyer_name}*\n\n`;

		    if (
		    	this.order.buyer 
		    ) {
		    	

		    	if (this.order.buyer.phone) {

		    		message += `*Telefono: ${this.order.buyer.phone}*\n\n`;

		    	} else if (
		    		this.order.buyer.comercio_city_client
		    		&& this.order.buyer.comercio_city_client.phone
		    	) {

		    		message += `*Telefono: ${this.order.buyer.comercio_city_client.phone}*\n\n`;
		    	}

		    } 


		    if (this.order.deliver) {

		    	message += `*Direccion de entrega:* ${this.order.address} \n \n`
		    } else {
		    	message += `*Retiro por el local* \n \n`
		    }
		    
		    message += `*Productos:*\n`;

		    let index = 1
		    this.order.articles.forEach(article => {
		        message += `*${index}) ${article.name}* \n     Cantidad: ${article.pivot.amount} \n     Precio: ${this.price(article.pivot.price)} \n     Total: ${this.price(article.pivot.amount * article.pivot.price)}\n\n`;
		        index++
		    });

		    this.order.promociones_vinoteca.forEach(promo => {
		        message += `*${index}) ${promo.name}* \n     Cantidad: ${promo.pivot.amount} \n     Precio: ${this.price(promo.pivot.price)} \n     Total: ${this.price(promo.pivot.amount * promo.pivot.price)}\n`;
		        index++
		    });

		    message += `\n\n *Total:* ${this.price(this.order.total)}`

		    if (this.order.fecha_entrega) {

		    	message += `\n \n *Fecha de entrega:* ${this.date(this.order.fecha_entrega)}`
		    }

		    if (this.order.description) {

		    	message += `\n \n *Observaciones:* ${this.order.description}`
		    }

		    // Encodear el mensaje para URL
		    const encoded_message = encodeURIComponent(message);

		    // Generar el link con número sin + ni espacios
		    let link = `https://wa.me/${this.commerce.phone}?text=${encoded_message}`;
		    // let link = `https://api.whatsapp.com/send?phone=${this.commerce.phone}?text=${encoded_message}`;
		    this.whatsapp_link = link
		    // window.open(link)
		},
		try_open_link() {
            const win = window.open(this.whatsapp_link, '_blank');
            if (!win || win.closed || typeof win.closed === 'undefined') {
                // El navegador bloqueó la ventana emergente

                if (confirm('No se pudo abrir WhatsApp automáticamente. Sera redirigido hacia WhatsApp para poder finalizar con su pedido')) {

                	window.location.href = this.whatsapp_link;
                }
            }
        }
	}
}	
</script>
<style lang="sass">
.thanks
	p, .text-with-icon
		color: #333 !important

	.btn-whatsapp
		background: #25D366
		font-size: 25px
</style>