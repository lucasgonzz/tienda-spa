import VueHorizontalList from 'vue-horizontal-list/dist/vue-horizontal-list.esm.js'

// La versión 1.3.0 conserva el debounce de scroll después de destruir la lista.
// Heredar su render mantiene los slots, las clases y la navegación originales.
export default {
	name: 'HorizontalListSegura',
	extends: VueHorizontalList,
	data() {
		return { lista_destruida: false }
	},
	beforeDestroy() {
		this.lista_destruida = true
		clearTimeout(this.scrollTimer)
		this.scrollTimer = null
	},
	methods: {
		go(position) {
			if (this.lista_destruida || !this.$refs.list || !this.$refs.list.isConnected) return
			VueHorizontalList.methods.go.call(this, position)
		},
		scrollHandler() {
			clearTimeout(this.scrollTimer)
			if (this.lista_destruida) return
			this.scrollTimer = setTimeout(() => {
				this.scrollTimer = null
				const list = this.$refs.list
				const items = this.$refs.item
				if (this.lista_destruida || !list || !list.isConnected || !Array.isArray(items) || !items.length) return
				if (items.length !== this._items.length || items.some(item => !item || !item.isConnected)) return
				const left = list.getBoundingClientRect().left
				const distances = items.map(item => Math.abs(item.getBoundingClientRect().left - left))
				this.position = distances.indexOf(Math.min(...distances))
			}, 50)
		},
	},
}
