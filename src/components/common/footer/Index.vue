<template>
	<b-row
	v-if="show"
	:class="margin_bottom"
	class="site-footer">
		<b-col cols="12" class="p-0">
			<div class="site-footer__surface">
				<b-row class="site-footer__grid">
					<b-col
					v-if="categories.length"
					cols="12"
					md="4"
					class="site-footer__col">
						<p class="site-footer__eyebrow">
							Navegación
						</p>
						<h3 class="site-footer__title">
							Categorías
						</h3>
						<ul class="site-footer__list">
							<li
							v-for="category in categories"
							:key="category.id">
								<span
								class="site-footer__cat"
								role="button"
								tabindex="0"
								@click="setSelectedCategory(category)"
								@keyup.enter="setSelectedCategory(category)">
									{{ category.name }}
								</span>
							</li>
						</ul>
					</b-col>
					<b-col
					v-if="commerce.phone || commerce.email"
					cols="12"
					md="4"
					class="site-footer__col">
						<p class="site-footer__eyebrow">
							Atención
						</p>
						<h3 class="site-footer__title">
							Contactanos
						</h3>
						<ul class="site-footer__list">
							<li v-if="commerce.email">
								<a
								class="site-footer__link"
								:href="'mailto:' + commerce.email">
									<i
									class="bi bi-envelope site-footer__icon"
									aria-hidden="true"></i>
									{{ commerce.email }}
								</a>
							</li>
							<li v-if="commerce.phone">
								<a
								class="site-footer__link"
								:href="'https://api.whatsapp.com/send?phone=' + commerce.phone"
								target="_blank"
								rel="noopener noreferrer">
									<i
									class="bi bi-whatsapp site-footer__icon"
									aria-hidden="true"></i>
									{{ commerce.phone }}
								</a>
							</li>
						</ul>
					</b-col>
					<b-col
					v-if="commerce.online_configuration.instagram || commerce.online_configuration.facebook"
					cols="12"
					md="4"
					class="site-footer__col">
						<p class="site-footer__eyebrow">
							Comunidad
						</p>
						<h3 class="site-footer__title">
							Buscanos en
						</h3>
						<ul class="site-footer__list">
							<li v-if="commerce.online_configuration.instagram">
								<a
								class="site-footer__link"
								target="_blank"
								rel="noopener noreferrer"
								:href="commerce.online_configuration.instagram">
									<i
									class="bi bi-instagram site-footer__icon"
									aria-hidden="true"></i>
									Instagram
								</a>
							</li>
							<li v-if="commerce.online_configuration.facebook">
								<a
								class="site-footer__link"
								target="_blank"
								rel="noopener noreferrer"
								:href="commerce.online_configuration.facebook">
									<i
									class="bi bi-facebook site-footer__icon"
									aria-hidden="true"></i>
									Facebook
								</a>
							</li>
						</ul>
					</b-col>
				</b-row>
			</div>
		</b-col>
		<copyright-component></copyright-component>
	</b-row>
</template>

<script>
import categories from '@/mixins/_categories'

/**
 * Pie de sitio: columnas de categorías, contacto y redes con estilo tipo “tarjeta” alineado al resto de la tienda.
 */
export default {
	mixins: [categories],
	components: {
		CopyrightComponent: () => import('@/components/common/footer/Copyright'),
	},
	computed: {
		/**
		 * Oculta el footer en vistas de mensajes o mapas donde el layout es distinto.
		 * @returns {boolean}
		 */
		show() {
			return this.route_name != 'Messages' && this.route_name != 'Maps'
		},
		/**
		 * Categorías activas del store para el listado rápido.
		 * @returns {Array}
		 */
		categories() {
			return this.$store.state.categories.categories
		},
		/**
		 * Ajuste de margen inferior en móvil según ruta y carrito (comportamiento heredado).
		 * @returns {string}
		 */
		margin_bottom() {
			if (this.is_mobile) {
				if (this.route_name == 'Article') {
					return ''
				}
				if (this.route_name == 'Home' && this.cart_articles.length) {
					return ''
				}
			}
			return 'margin-bottom'
		},
	},
}
</script>

<style lang="scss" scoped>
@import '@/sass/_custom.scss';

/* Bloque principal: superficie elevada y borde de acento (misma línea visual que Contacto). */
.site-footer {
  font-family: var(--font-family-sans);
  margin-top: 1.5rem;

  &__surface {
    border-radius: 16px 16px 0 0;
    padding: 1.75rem 1.25rem 1.5rem;
    border-top: 3px solid var(--secondary-color);
    box-shadow: 0 -6px 28px rgba(0, 0, 0, 0.06);

    @if $theme == dark {
      background: #1a1a1a;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-top: 3px solid var(--secondary-color);
    } @else if $theme == ligth {
      background: #fff;
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-top: 3px solid var(--secondary-color);
    }
  }

  &__grid {
    margin-left: -8px;
    margin-right: -8px;
  }

  &__col {
    padding-left: 12px;
    padding-right: 12px;
    margin-bottom: 1.25rem;

    @media (min-width: 768px) {
      margin-bottom: 0;
    }
  }

  &__eyebrow {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 0.25rem;
    color: var(--secondary-color);
    text-align: left;
  }

  &__title {
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0 0 0.85rem;
    text-align: left;
    line-height: 1.3;

    @if $theme == dark {
      color: #f5f5f5;
    } @else {
      color: #1a1a1a;
    }
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    text-align: left;
  }

  &__list li {
    margin-bottom: 0.45rem;
  }

  &__icon {
    margin-right: 0.45rem;
    font-size: 1.05rem;
    vertical-align: -0.1em;
  }

  &__link {
    display: inline-flex;
    align-items: center;
    font-size: 0.95rem;
    font-weight: 500;
    text-decoration: none;
    transition: color 0.15s ease;

    @if $theme == dark {
      color: rgba(255, 255, 255, 0.88);
    } @else {
      color: #333;
    }

    &:hover {
      color: var(--secondary-color);
      text-decoration: none;
    }
  }

  &__cat {
    display: inline-block;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.15s ease;

    @if $theme == dark {
      color: rgba(255, 255, 255, 0.88);
    } @else {
      color: #333;
    }

    &:hover {
      color: var(--secondary-color);
    }
  }

  /* Compensa el alto del botón flotante / barra en móvil cuando aplica margin_bottom. */
  &.margin-bottom {
    margin-bottom: -65px !important;
  }
}
</style>
