<template>
	<div class="cart-page view-p-t">
		<b-row class="cart-page__hero justify-content-center">
			<b-col
			cols="12">
				<p class="cart-page__eyebrow">
					Tu compra
				</p>
				<h1 class="cart-page__title">
					Carrito
				</h1>
				<p class="cart-page__lead">
					Revisá los productos y el total antes de iniciar la compra.
				</p>
			</b-col>
		</b-row>

		<div
		v-if="loading_last_cart"
		class="cart-page__loading">
			<b-row class="justify-content-center">
				<b-col
				cols="12"
				lg="10">
					<div class="cart-page__card cart-page__card--loading">
						<loading></loading>
					</div>
				</b-col>
			</b-row>
		</div>

		<div
		v-else
		class="cart-page__main">
			<b-row class="justify-content-center cart-page__grid">
				<b-col
				class="d-lg-none"
				v-if="cant_cart_items > 0"
				cols="12"
				lg="4">
					<div class="cart-page__card cart-page__card--summary">
						<p
						class="cart-page__section-label">
							Resumen
						</p>
						<footer-component></footer-component>
					</div>
				</b-col>
				<b-col
				cols="12"
				:lg="cant_cart_items > 0 ? 8 : 10">
					<div class="cart-page__card cart-page__card--items">
						<p
						class="cart-page__section-label">
							Productos
						</p>
						<list
						:hide_title="true"></list>
					</div>
				</b-col>
				<b-col
				v-if="cant_cart_items > 0"
				cols="12 d-none d-lg-block"
				lg="4"
				class="cart-page__summary-col">
					<div class="cart-page__card cart-page__card--summary">
						<p
						class="cart-page__section-label">
							Resumen
						</p>
						<footer-component></footer-component>
					</div>
				</b-col>
			</b-row>
		</div>
	</div>
</template>

<script>
import List from '@/components/cart/components/List'
import cart from '@/mixins/cart'

/**
 * Vista del carrito: layout en dos columnas (lista + resumen) alineado al resto de páginas institucionales.
 */
export default {
	mixins: [cart],
	name: 'Cart',
	components: {
		List,
		FooterComponent: () => import('@/components/cart/components/Footer'),
		Loading: () => import('@/components/cart/components/Loading'),
	},
	created() {
		this.setTitle('Carrito')
	},
}
</script>

<style lang="scss">
/*
 * Estilo carrito ecommerce: hero, tarjetas con borde de acento y tipografía del sitio.
 */
.cart-page {
  font-family: var(--font-family-sans, sans-serif);
  // max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding-bottom: 2.5rem;
}

.cart-page__hero {
  margin-bottom: 1.5rem;
  text-align: center;

  @media (min-width: 992px) {
    text-align: left;
  }
}

.cart-page__eyebrow {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--secondary-color);
  font-weight: 600;
  margin-bottom: 0.35rem;
}

.cart-page__title {
  font-size: 1.85rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
  line-height: 1.25;
}

.cart-page__lead {
  font-size: 1.05rem;
  line-height: 1.5;
  color: #666;
  margin-bottom: 0;
  max-width: 36rem;
  margin-left: auto;
  margin-right: auto;

  @media (min-width: 992px) {
    margin-left: 0;
    margin-right: 0;
  }
}

.cart-page__loading {
  margin-top: 0.25rem;
}

.cart-page__card {
  background: #fff;
  border-radius: 14px;
  padding: 1.25rem 1.15rem;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.07);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-top: 3px solid var(--secondary-color);
  margin-bottom: 1rem;

  @media (min-width: 992px) {
    padding: 1.5rem 1.4rem;
    margin-bottom: 0;
  }
}

.cart-page__card--loading {
  min-height: 200px;
}

.cart-page__summary-col {
  @media (min-width: 992px) {
    align-self: flex-start;
  }
}

.cart-page__card--summary {
  @media (min-width: 992px) {
    position: sticky;
    top: 110px;
    z-index: 2;
  }
}

.cart-page__section-label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--secondary-color);
  margin-bottom: 0.85rem;
  text-align: left;
}

.cart-page__grid {
  align-items: flex-start;
}

/* Estado vacío del listado (clases en List.vue). */
.cart-page ::v-deep .cart-list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2.5rem 1rem;
  color: #555;
}

.cart-page ::v-deep .cart-list-empty__icon {
  font-size: 3rem;
  color: color-mix(in srgb, var(--secondary-color) 75%, #888);
  margin-bottom: 0.75rem;
}

.cart-page ::v-deep .cart-list-empty__text {
  font-size: 1.05rem;
  font-weight: 600;
}

</style>
