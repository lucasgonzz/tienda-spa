<template>
	<b-row
	v-if="!is_city_selected">
		<b-col
		md="8"
		lg="6"
		xl="4">
			<div
			class="cont-center">
				<div
				class="w-100">
					<h4>
						Selecciona tu ciudad
					</h4>
					<b-form-group>
						<b-form-select
						v-model="provincia"
						:options="provincias_options"></b-form-select>
					</b-form-group>
					<b-form-group>
						<b-form-select
						v-model="ciudad"
						:options="city_options"></b-form-select>
					</b-form-group>
					<b-form-group>
						<b-button
						block 
						variant="success"
						@click="setCity">
							Siguiente
						</b-button>
					</b-form-group>
				</div>
			</div>
		</b-col>
	</b-row>
</template>
<script>
import address from '@/mixins/address'
export default {
	mixins: [address],
	data() {
		return {
			provincia: '',
			ciudad: '',
		}
	},
	created() {
		// this.initCity()
		console.log('creado')
		this.provincia = ''
		this.ciudad = ''
		this.$store.commit('address/setCity', '')
		this.$store.commit('address/setProvince', '')
	},
	watch: {
		provincia() {
			this.ciudad = ''
		}
	},
	computed: {
		ciudades() {
			return this.$store.state.political.ciudades	
		},
		provincias() {
			return this.$store.state.political.provincias.sort((a, b) => a.iso_nombre > b.iso_nombre)
		},
		address() {
			return this.$store.state.address.address
		},
		provincias_options() {
			let options = []
			options.push({
				text: 'Seleccione la provincia',
				value: '',
			})
			this.provincias.forEach(prov => {
				options.push({
					text: prov.iso_nombre,
					value: prov.iso_nombre,
				})
			})
			return options
		},
		city_options() {
			let ciudades = this.ciudades.filter(city => {
				return city.provincia.nombre == this.provincia
			})
			if (this.provincia == 'Santa Fe') {
				ciudades.push({nombre: 'Capitán Bermúdez'})
				ciudades.push({nombre: 'Granadero Baigorria'})
			}
			let options = []
			options.push({
				text: 'Seleccione la ciudad',
				value: '',
			})
			ciudades.sort((a, b) => (a.name > b.name) ? 1 : -1)
			ciudades.forEach(city => {
				options.push({
					text: city.nombre,
					value: city.nombre,
				})
			})
			return options
		}
	},
	methods: {
		setCity() {
			if (this.ciudad != '') {
				this.$store.commit('address/setCity', this.ciudad)
				this.$store.commit('address/setProvince', this.provincia)
			} else {
				this.$toast.error('Seleccione su ciudad, por favor')
			}
		},
		initCity() {
			let ciudad = this.ciudades.find(city => {
				return this.commerce.addresses.length && city.nombre == this.commerce.addresses[0].city
			})
			let provincia = this.provincias.find(prov => {
				return prov.iso_nombre == ciudad.provincia.nombre
			})
			this.provincia = provincia.iso_nombre
			setTimeout(() => {
				this.ciudad = ciudad.nombre
			}, 100)
		},
	}
}
</script>