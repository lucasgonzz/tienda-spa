<template>
<b-modal id="cards" hide-header hide-footer size="sm">
	<b-list-group>
		<b-list-group-item
		v-for="card in cards"
		:key="card.id">
			<p>
				Primeros 6 digitos: {{ card.first_six_digits }}
			</p>
			<p>
				Terminada en: {{ card.last_four_digits }}
			</p>
			<p>
				Codigo de seguridad: {{ card.security_code.length }} numeros
			</p>
		</b-list-group-item>
	</b-list-group>
</b-modal>
</template>
<script>
export default {
	computed: {
		cards() {
			return this.$store.state.payment_gateway.cards
		}
	} 
}
</script>