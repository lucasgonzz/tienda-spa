<template>
	<b-sidebar
	shadow
	@hidden="enableScroll"
	v-model="categories_sidebar_visibility"
	title="Categorías"
	class="cont-items nav-categories-sidebar"
	id="cont-categories">
		<div class="nav-categories__list">
			<div
			v-for="category in categories"
			:key="category.id"
			class="nav-categories__group"
			:class="{ 'nav-categories__group--expanded': is_active_category(category) }">
				<div
				class="nav-categories__row"
				:class="{ 'nav-categories__row--active': is_row_active_category(category) }">
					<button
					v-if="subcategories_count(category) > 0"
					type="button"
					class="nav-categories__toggle"
					:aria-expanded="is_active_category(category) ? 'true' : 'false'"
					:aria-label="toggle_aria_label(category)"
					@click.stop="show_sub_categories(category)">
						<i
						class="bi nav-categories__chevron"
						:class="is_active_category(category) ? 'bi-chevron-up' : 'bi-chevron-down'"
						aria-hidden="true"></i>
					</button>
					<span
					v-else
					class="nav-categories__toggle-spacer"
					aria-hidden="true"></span>

					<button
					type="button"
					class="nav-categories__name"
					@click.stop="setCategory(category)">
						{{ category.name }}
					</button>

					<button
					v-if="subcategories_count(category) > 0"
					type="button"
					class="nav-categories__badge nav-categories__badge--subs"
					:title="'Ver ' + subcategories_count(category) + ' subcategorías'"
					@click.stop="show_sub_categories(category)">
						{{ subcategories_count(category) }}
						<span class="nav-categories__badge-label">sub</span>
					</button>
					<span
					v-else
					class="nav-categories__badge nav-categories__badge--articles"
					:title="category.articles_count + ' artículos en esta categoría'">
						{{ category.articles_count }}
						<span class="nav-categories__badge-label">prod.</span>
					</span>
				</div>

				<div
				v-if="subcategories_count(category) > 0"
				class="nav-categories__subs-wrap">
					<sub-categories
					v-if="is_active_category(category)"
					:category="category"></sub-categories>
				</div>
			</div>
		</div>
	</b-sidebar>
</template>

<script>
import categories from '@/mixins/_categories'

/**
 * Panel lateral de categorías: lista vertical, conteo de subcategorías o productos, y acceso a categoría o subcategorías.
 */
export default {
	mixins: [categories],
	props: {
		show: Boolean,
	},
	components: {
		SubCategories: () => import('@/components/nav/categories/SubCategories'),
	},
	computed: {
		/**
		 * Categorías publicadas disponibles en el store.
		 * @returns {Array}
		 */
		categories() {
			return this.$store.state.categories.categories
		},
		/**
		 * Visibilidad del sidebar sincronizada con el store auth.
		 */
		categories_sidebar_visibility: {
			get() {
				return this.$store.state.auth.categories_sidebar_visibility
			},
			set(value) {
				this.$store.commit('auth/set_categories_sidebar_visibility', value)
			},
		},
	},
	watch: {
		/**
		 * Al abrir el panel, bloquea scroll en escritorio (comportamiento heredado).
		 * @param {boolean} new_val
		 */
		categories_sidebar_visibility(new_val) {
			if (new_val) {
				this.disableScroll()
			} else {
				this.enableScroll()
			}
		},
	},
	data() {
		return {
			/** id de categoría cuyas subcategorías están desplegadas; 0 si ninguna */
			show_sub_category: 0,
		}
	},
	methods: {
		/**
		 * Cantidad de subcategorías de un ítem (maneja array ausente).
		 * @param {object} category
		 * @returns {number}
		 */
		subcategories_count(category) {
			let subs = category.sub_categories
			return Array.isArray(subs) ? subs.length : 0
		},
		/**
		 * Indica si la fila debe mostrar estado activo (categoría seleccionada o panel de subs abierto).
		 * @param {object} category
		 * @returns {boolean}
		 */
		is_row_active_category(category) {
			if (this.is_active_category(category)) {
				return true
			}
			let selected = this.$store.state.categories.selected_category
			return selected && selected.id == category.id
		},
		/**
		 * Texto accesible para el botón que expande subcategorías.
		 * @param {object} category
		 * @returns {string}
		 */
		toggle_aria_label(category) {
			let n = this.subcategories_count(category)
			let action = this.is_active_category(category) ? 'Ocultar' : 'Mostrar'
			return action + ' ' + n + ' subcategorías de ' + category.name
		},
		/**
		 * La categoría dada tiene el panel de subcategorías abierto.
		 * @param {object} category
		 * @returns {boolean}
		 */
		is_active_category(category) {
			return this.show_sub_category == category.id
		},
		/**
		 * Evita scroll del body al tener abierto el sidebar (solo desktop).
		 */
		disableScroll() {
			if (!this.is_mobile) {
				document.body.style.overflow = 'hidden'
			}
		},
		/**
		 * Restaura scroll al cerrar el sidebar.
		 */
		enableScroll() {
			document.body.style.overflow = 'auto'
		},
		/**
		 * Navega a la categoría (todos los productos de la categoría).
		 * @param {object} category
		 */
		setCategory(category) {
			this.setSelectedCategory(category)
		},
		/**
		 * Abre o cierra el bloque de subcategorías para esta categoría.
		 * @param {object} category
		 */
		show_sub_categories(category) {
			if (this.show_sub_category == category.id) {
				this.show_sub_category = 0
			} else {
				this.show_sub_category = category.id
			}
		},
	},
}
</script>

<style lang="scss">
/*
 * Estilos del panel de categorías: mayor especificidad que _sidebars.sass (.cont-items)
 * para usar variables de tema y layout tipo ecommerce.
 */
.nav-categories-sidebar.cont-items {
  font-family: var(--font-family-sans, sans-serif);

  .b-sidebar-body {
    padding-top: 0.25rem;
  }

  .item {
    border-bottom: none;
    padding: 0;
  }

  .nav-categories__list {
    padding: 0.25rem 0 1rem;
  }

  .nav-categories__group {
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    margin: 0 0.5rem;

    &:last-child {
      border-bottom: none;
    }
  }

  .nav-categories__group--expanded .nav-categories__row {
    background: color-mix(in srgb, var(--secondary-color) 12%, transparent);
  }

  .nav-categories__row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.35rem;
    min-height: 3rem;
    padding: 0.35rem 0.25rem;
    border-radius: 10px;
    transition: background 0.15s ease;

    &:hover {
      background: rgba(0, 0, 0, 0.04);
    }
  }

  .nav-categories__row--active:not(:hover) {
    background: color-mix(in srgb, var(--primary-color) 10%, transparent);
  }

  .nav-categories__toggle,
  .nav-categories__toggle-spacer {
    flex: 0 0 2rem;
    width: 2rem;
    height: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .nav-categories__toggle {
    border: none;
    background: transparent;
    color: var(--secondary-color);
    border-radius: 8px;
    padding: 0;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;

    &:hover {
      background: color-mix(in srgb, var(--secondary-color) 22%, transparent);
      color: var(--primary-color);
    }

    &:focus {
      outline: 2px solid var(--secondary-color);
      outline-offset: 1px;
    }
  }

  .nav-categories__chevron {
    font-size: 1.1rem;
  }

  .nav-categories__name {
    flex: 1 1 auto;
    text-align: left;
    border: none;
    background: transparent;
    font-size: 0.95rem;
    font-weight: 600;
    color: #222;
    padding: 0.4rem 0.25rem;
    cursor: pointer;
    line-height: 1.3;
    transition: color 0.15s ease;

    &:hover {
      color: var(--secondary-color);
    }

    &:focus {
      outline: 2px solid var(--secondary-color);
      outline-offset: 1px;
    }
  }

  .nav-categories__badge {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: baseline;
    gap: 0.2rem;
    font-size: 0.8rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    line-height: 1.2;
    white-space: nowrap;
  }

  .nav-categories__badge-label {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    opacity: 0.9;
  }

  .nav-categories__badge--subs {
    border: none;
    cursor: pointer;
    background: color-mix(in srgb, var(--secondary-color) 18%, #fff);
    color: color-mix(in srgb, var(--secondary-color) 85%, #000);

    &:hover {
      background: color-mix(in srgb, var(--secondary-color) 35%, #fff);
    }
  }

  .nav-categories__badge--articles {
    background: rgba(0, 0, 0, 0.06);
    color: #444;
    cursor: default;
  }

  .nav-categories__subs-wrap {
    padding: 0 0.25rem 0.65rem 0.25rem;
  }
}
</style>
