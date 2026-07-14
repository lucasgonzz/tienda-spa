<template>
	<div class="background">
		<h5>
			Identificación
		</h5>
		<b-form-input
		class="m-b-15"
		v-model="buyer.name"
		placeholder="Nombre y apellido"></b-form-input>
		<b-form-input
		class="m-b-15"
		v-model="buyer.phone"
		placeholder="Telefono sin 0 ni 15. Ej: 3444622139"></b-form-input>
		<b-form-input
		class="m-b-15"
		v-model="buyer.email"
		@blur="buscar_direccion_guardada"
		@keyup.enter="buscar_direccion_guardada"
		placeholder="Correo electronico"></b-form-input>
		<b-form-input
		class="m-b-15"
		v-model="buyer.ciudad"
		placeholder="Ciudad"></b-form-input>
		<b-form-input
		v-if="commerce.online_configuration.pedir_barrio_al_registrarse"
		class="m-b-15"
		v-model="buyer.barrio"
		placeholder="Barrio"></b-form-input>
		<b-form-input
		class="m-b-15"
		v-model="buyer.address"
		@input="direccion_autocompletada = false"
		placeholder="Direccion"></b-form-input>
		<div
		v-if="buscando_direccion"
		class="text-muted"
		style="font-size: 0.85rem; margin-top: -10px; margin-bottom: 15px;">
			Buscando tus datos...
		</div>
		<div
		v-else-if="direccion_autocompletada"
		class="text-muted"
		style="font-size: 0.85rem; margin-top: -10px; margin-bottom: 15px;">
			Usamos la dirección de tu última compra. Si querés que te lo enviemos a otro lado, cambiala acá.
		</div>
	</div>
</template>
<script>
import payment_set_height from '@/mixins/payment_set_height'
export default {
	mixins: [payment_set_height],
	data() {
		return {
			// Ultimo email consultado contra el endpoint de prefill, para no repetir
			// la llamada si el comprador entra y sale del campo sin cambiarlo.
			ultimo_email_consultado: '',
			// Indica si la consulta de prefill esta en curso (indicador discreto, sin spinner)
			buscando_direccion: false,
			// True cuando el campo Direccion se completo solo con el prefill del servidor.
			// Se apaga apenas el comprador edita el campo a mano (@input de arriba).
			direccion_autocompletada: false,
		}
	},
	computed: {
		/**
		 * Datos del comprador invitado persistidos en el store del carrito.
		 *
		 * @returns {object}
		 */
		buyer() {
			return this.$store.state.cart.buyer
		},
	},
	methods: {
		/**
		 * Al terminar de escribir el email, consulta si ese comprador ya existe en la
		 * tienda y trae su ultima direccion de envio para autocompletar el formulario.
		 *
		 * Solo completa campos que el comprador dejo VACIOS: si ya escribio una
		 * direccion a mano, no se la pisa. La direccion autocompletada sigue siendo
		 * totalmente editable -- el objetivo es que la VEA antes de confirmar, no
		 * imponersela.
		 *
		 * Se dispara solo con el email (decision de Lucas, 14/7/2026): hay vendedores
		 * que solo le piden el mail al cliente para cargarle el pedido, y pedir un
		 * dato mas seria friccion en ese caso de uso.
		 */
		buscar_direccion_guardada() {
			// Sin email, o email invalido, o el mismo que ya se consulto: no hacer nada
			const email = (this.buyer.email || '').trim()
			if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
				return
			}
			if (email === this.ultimo_email_consultado) {
				return
			}
			this.ultimo_email_consultado = email
			
			this.buscando_direccion = true
			this.$api.post('buyer/checkout-address', {
				email       : email,
				commerce_id : this.commerce.id,
			})
			.then(res => {
				this.buscando_direccion = false
				
				if (!res.data.found) {
					return
				}
				
				// La direccion (y el flag que dispara el aviso) solo se completan si
				// el comprador encontrado REALMENTE tiene una direccion guardada y el
				// campo del formulario esta vacio. El flag NO se levanta solo por
				// "found": si no hay direccion guardada o el campo ya tenia algo
				// tipeado, no hay nada que autocompletar y no hay nada que avisar.
				if (res.data.address && !this.buyer.address) {
					this.$store.commit('cart/set_buyer_field', { field: 'address', value: res.data.address })
					this.direccion_autocompletada = true
				}
				
				if (res.data.ciudad && !this.buyer.ciudad) {
					this.$store.commit('cart/set_buyer_field', { field: 'ciudad', value: res.data.ciudad })
				}
				
				if (res.data.barrio && !this.buyer.barrio) {
					this.$store.commit('cart/set_buyer_field', { field: 'barrio', value: res.data.barrio })
				}
			})
			.catch(() => {
				this.buscando_direccion = false
				// Silencioso a proposito: que la tienda no responda esta consulta
				// interna nunca puede convertirse en un obstaculo para comprar.
			})
		},
	},
}
</script>
