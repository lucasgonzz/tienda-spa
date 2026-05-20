<template>
	<b-col
	class="site-footer-copyright"
	cols="12">
		<div class="site-footer-copyright__inner">
			<p class="site-footer-copyright__line">
				Copyright {{ commerce.company_name }} - {{ year }}. Todos los derechos reservados.
			</p>
			<p class="site-footer-copyright__credit">
				<a
				class="site-footer-copyright__credit-link"
				href="https://comerciocity.com"
				target="_blank"
				rel="noopener noreferrer">
					Creado con
					<img
					class="site-footer-copyright__logo"
					src="@/assets/comerciocity-logo.png"
					alt="ComercioCity">
				</a>
			</p>
		</div>
	</b-col>
</template>

<script>
import moment from 'moment'

/**
 * Franja inferior de copyright y crédito ComercioCity.
 */
export default {
	computed: {
		/**
		 * Año actual para el texto legal.
		 * @returns {string}
		 */
		year() {
			return moment().format('Y')
		},
	},
}
</script>

<style lang="scss" scoped>
@import '@/sass/_custom.scss';

.site-footer-copyright {
  padding: 0;
  margin-top: 0;
}

.site-footer-copyright__inner {
  font-family: var(--font-family-sans);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 1rem 1.25rem 1.25rem;
  background: color-mix(in srgb, var(--primary-color) 82%, #000 18%);
  align-items: center;
  text-align: center;

  @media (min-width: 768px) {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    text-align: left;
    padding: 1rem 1.5rem 1.15rem;
  }
}

.site-footer-copyright__line {
  color: rgba(255, 255, 255, 0.88);
  font-size: 0.88rem;
  font-weight: 500;
  margin: 0;
  line-height: 1.45;
}

.site-footer-copyright__credit {
  margin: 0;
}

.site-footer-copyright__credit-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.8rem;
  font-weight: 500;
  text-decoration: none;
  transition: opacity 0.15s ease;

  &:hover {
    color: rgba(255, 255, 255, 0.95);
    text-decoration: none;
    opacity: 1;
  }
}

.site-footer-copyright__logo {
  width: 72px;
  height: auto;
  vertical-align: middle;
  opacity: 0.95;
}
</style>
