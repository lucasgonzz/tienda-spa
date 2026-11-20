<template>
	<div @click.stop>
		<b-modal
		v-if="selector"
		:visible="true"
		title="Elegí cómo comprar"
		size="sm"
		:hide-footer="true"
		:no-close-on-backdrop="guardando"
		:no-close-on-esc="guardando"
		:hide-header-close="guardando"
		@hidden="terminar">
			<p>{{ compra.name }}</p>
			<variants />
			<cantidad :article="compra" />
			<add-to-cart ref="guardar" :article="compra" compacto class="selector-compra__guardado" />
			<b-button variant="primary" block :disabled="guardando" @click="guardar">
				{{ guardando ? 'Guardando…' : 'Agregar al carrito' }}
			</b-button>
			<b-button variant="link" block :disabled="guardando" @click="terminar">Cancelar</b-button>
		</b-modal>
		<add-to-cart v-else ref="guardar" :article="compra" compacto class="d-none" />
	</div>
</template>
<script>
import AddToCart from '@/components/article/components/data/add-to-cart/Index'
import Cantidad from '@/components/article/components/data/buy-box/Cantidad'
import Variants from '@/components/article/components/data/Variants'
import { cantidad_inicial, requiere_selector, soltar_compra } from '@/helpers/compra_desde_tarjeta'
export default {
	props: { article: Object },
	components: { AddToCart, Cantidad, Variants },
	data() {
		return { compra: null, selector: false, guardando: false, anterior: null, terminado: false }
	},
	created() {
		const estado = this.$store.state.articles
		this.anterior = {
			article: estado.article_to_show, amount: estado.amount,
			notes: estado.notes, variante: estado.selected_article_variant,
			propiedades: estado.article_to_show && estado.article_to_show.selected_article_properties,
			indice: estado.image_index, editada: estado.cantidad_editada_en_ficha,
		}
		// Los controles existentes trabajan sobre el store; la tarjeta original no se muta.
		this.compra = JSON.parse(JSON.stringify(this.article))
		this.compra.images = this.compra.images || []
		this.$store.commit('articles/setArticleToShow', this.compra)
		this.$store.commit('articles/setNotes', '')
		const config = this.commerce.online_configuration
		this.$store.commit('articles/setAmount', cantidad_inicial(config) || '')
		this.selector = requiere_selector(this.compra, config)
		if (!this.selector) this.$nextTick(this.guardar)
	},
	beforeDestroy() {
		this.restaurar()
		soltar_compra(this.$store)
	},
	methods: {
		restaurar() {
			if (!this.anterior || this.$store.state.articles.article_to_show !== this.compra) return
			this.$store.commit('articles/setArticleToShow', this.anterior.article)
			if (this.anterior.article && this.anterior.propiedades) this.$set(this.anterior.article, 'selected_article_properties', this.anterior.propiedades)
			this.$store.commit('articles/setAmount', this.anterior.amount)
			this.$store.commit('articles/setNotes', this.anterior.notes)
			this.$store.commit('articles/setSelectedArticleVariant', this.anterior.variante)
			this.$store.commit('articles/setImageIndex', this.anterior.indice)
			this.$store.commit('articles/setCantidadEditadaEnFicha', this.anterior.editada)
		},
		terminar() {
			if (this.guardando || this.terminado) return
			this.terminado = true
			this.restaurar()
			this.$emit('terminar')
		},
		guardar() {
			if (this.guardando || this.terminado) return
			this.guardando = true
			Promise.resolve(this.$refs.guardar.saveCart())
			.then(ok => {
				this.guardando = false
				if (ok || !this.selector) this.terminar()
			})
			.catch(() => {
				this.guardando = false
				if (!this.selector) this.terminar()
			})
		},
	},
}
</script>
<style lang="sass">
.selector-compra__guardado
	.cont-input-btn-add
		display: none
</style>
