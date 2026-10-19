<template>
	<b-modal
	v-if="user && direcciones_de_envio_activas"
	id="mis-direcciones"
	title="Mis direcciones"
	size="lg"
	hide-footer
	lazy
	@hidden="abierto = false"
	@show="abierto = true">
		<p class="mis-direcciones__intro">
			Elegí cuál es tu dirección principal: es la que usamos de entrada cuando comprás con envío a domicilio.
		</p>
		<direcciones
		v-if="abierto"
		modo="cuenta"
		guardar_en_la_cuenta
		:pide_codigo_postal="!!commerce.envios_zipnova"></direcciones>
	</b-modal>
</template>
<script>
import Direcciones from '@/components/common/direcciones/Index'
import { direcciones_activas } from '@/helpers/direcciones'

/**
 * "Mi cuenta → Mis direcciones" (misión formas-envio-direcciones-maps, 19/10/2026): las
 * direcciones guardadas del comprador, para agregar (con el buscador de Google o a mano), borrar y
 * elegir la principal. Las mismas que ve en el checkout.
 *
 * Solo existe con `commerce.direcciones_de_envio` (la base del cliente tiene la tabla
 * `buyer_addresses`); si no, ni el modal ni su opción del menú se dibujan.
 *
 * El contenido se monta al abrir (`abierto`): la lista se pide recién ahí, y el buscador arranca
 * limpio cada vez.
 */
export default {
	name: 'MisDirecciones',
	components: {
		Direcciones,
	},
	data() {
		return {
			abierto: false,
		}
	},
	computed: {
		direcciones_de_envio_activas() {
			return direcciones_activas(this.commerce)
		},
	},
}
</script>
<style lang="sass">
.mis-direcciones__intro
	font-size: .9rem
	color: rgba(0, 0, 0, .6)
	text-align: left
	margin: 0 0 1rem
</style>
