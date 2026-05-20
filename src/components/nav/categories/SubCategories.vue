<template>
	<ul class="nav-subcategories">
		<li
		v-for="sub_category in category.sub_categories"
		:key="sub_category.id"
		class="nav-subcategories__item">
			<button
			type="button"
			class="nav-subcategories__btn"
			@click.stop="on_pick_sub(category, sub_category)">
				<i
				class="bi bi-chevron-right nav-subcategories__icon"
				aria-hidden="true"></i>
				<span class="nav-subcategories__name">{{ sub_category.name }}</span>
				<span
				class="nav-subcategories__count"
				:title="sub_category.articles_count + ' artículos'">
					{{ sub_category.articles_count }}
				</span>
			</button>
		</li>
	</ul>
</template>

<script>
import _categories from '@/mixins/_categories'

/**
 * Lista anidada de subcategorías dentro del sidebar de categorías.
 */
export default {
	mixins: [_categories],
	props: {
		category: {
			type: Object,
			required: true,
		},
	},
	methods: {
		/**
		 * Navega a la subcategoría (mixin) y cierra el panel lateral de categorías.
		 * @param {object} category
		 * @param {object} sub_category
		 */
		on_pick_sub(category, sub_category) {
			this.setSubCategory(category, sub_category)
		},
	},
}
</script>

<style lang="scss" scoped>
.nav-subcategories {
  list-style: none;
  margin: 0;
  padding: 0 0 0 0.15rem;
  border-left: 3px solid color-mix(in srgb, var(--secondary-color) 55%, transparent);
}

.nav-subcategories__item {
  margin-bottom: 0.2rem;
}

.nav-subcategories__btn {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.35rem;
  text-align: left;
  border: none;
  background: rgba(0, 0, 0, 0.03);
  color: #333;
  font-family: var(--font-family-sans, sans-serif);
  font-size: 0.88rem;
  font-weight: 500;
  padding: 0.55rem 0.65rem 0.55rem 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: color-mix(in srgb, var(--secondary-color) 16%, #fff);
    color: color-mix(in srgb, var(--secondary-color) 50%, #000);
  }

  &:focus {
    outline: 2px solid var(--secondary-color);
    outline-offset: 1px;
  }
}

.nav-subcategories__icon {
  flex: 0 0 auto;
  font-size: 0.75rem;
  opacity: 0.75;
}

.nav-subcategories__name {
  flex: 1 1 auto;
  line-height: 1.3;
}

.nav-subcategories__count {
  flex: 0 0 auto;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.07);
  color: #555;
}
</style>
