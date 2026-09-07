<template>
	<div class="checkout-section">
		<h2 class="checkout-section__title">
			<i class="bi bi-person"></i>
			¿Quién hace la compra?
		</h2>

		<div class="checkout-field">
			<label class="checkout-field__label">
				Nombre y apellido
			</label>
			<b-form-input
			v-model="buyer.name"
			placeholder="Como figura en tu documento"></b-form-input>
		</div>

		<div class="checkout-field">
			<label class="checkout-field__label">
				Teléfono
			</label>
			<b-form-input
			v-model="buyer.phone"
			placeholder="Sin 0 ni 15. Ej: 3444622139"></b-form-input>
		</div>

		<div class="checkout-field">
			<label class="checkout-field__label">
				Correo electrónico
			</label>
			<b-form-input
			v-model="buyer.email"
			@blur="buscar_direccion_guardada"
			@keyup.enter="buscar_direccion_guardada"
			placeholder="Te mandamos ahí la confirmación"></b-form-input>
		</div>

		<div class="checkout-field">
			<label class="checkout-field__label">
				Ciudad
			</label>
			<b-form-input
			v-model="buyer.ciudad"
			placeholder="Ciudad"></b-form-input>
		</div>

		<div
		v-if="flag_activo(commerce.online_configuration.pedir_barrio_al_registrarse)"
		class="checkout-field">
			<label class="checkout-field__label">
				Barrio
			</label>
			<b-form-input
			v-model="buyer.barrio"
			placeholder="Barrio"></b-form-input>
		</div>

		<div class="checkout-field">
			<label class="checkout-field__label">
				Dirección
			</label>
			<b-form-input
			v-model="buyer.address"
			@input="direccion_autocompletada = false"
			placeholder="Calle, número, piso o departamento"></b-form-input>

			<p
			v-if="buscando_direccion"
			class="checkout-section__hint m-t-5 m-b-0">
				Buscando tus datos...
			</p>
			<p
			v-else-if="direccion_autocompletada"
			class="checkout-section__hint m-t-5 m-b-0">
				Usamos la dirección de tu última compra. Si querés que te lo enviemos a otro lado, cambiala acá.
			</p>
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
