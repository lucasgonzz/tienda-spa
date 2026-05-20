<template>
	<div class="quienes-somos-page view-p-t">
		<b-row class="quienes-somos-page__hero justify-content-center">
			<b-col
			cols="12"
			lg="10"
			xl="9">
				<p class="quienes-somos-page__eyebrow">
					Conocenos
				</p>
				<h1 class="quienes-somos-page__title">
					{{ commerce.online_configuration.titulo_quienes_somos }}
				</h1>
				<p
				v-if="commerce.company_name"
				class="quienes-somos-page__lead">
					{{ commerce.company_name }}
				</p>
			</b-col>
		</b-row>

		<b-row class="quienes-somos-page__body justify-content-center">
			<b-col
			cols="12"
			lg="10"
			xl="8">
				<article class="quienes-somos-page__card">
					<div
					class="quienes-somos-page__prose text-left"
					v-html="commerce.online_configuration.quienes_somos"></div>
				</article>
			</b-col>
		</b-row>
	</div>
</template>

<style lang="scss">
/*
 * Página institucional: mismo criterio visual que Contacto (acento secondary, tarjeta, tipografía Plus Jakarta del sitio).
 * Selectores bajo .quienes-somos-page para no filtrar estilos al HTML dinámico del resto de la app.
 */
.quienes-somos-page {
  font-family: var(--font-family-sans, sans-serif);
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding-bottom: 2.5rem;
}

.quienes-somos-page__hero {
  margin-bottom: 1.5rem;
  text-align: center;

  @media (min-width: 992px) {
    text-align: left;
  }
}

.quienes-somos-page__eyebrow {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--secondary-color);
  font-weight: 600;
  margin-bottom: 0.35rem;
}

.quienes-somos-page__title {
  font-size: 1.85rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
  line-height: 1.25;
}

.quienes-somos-page__lead {
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

.quienes-somos-page__body {
  align-items: flex-start;
}

.quienes-somos-page__card {
  background: #fff;
  border-radius: 14px;
  padding: 1.5rem 1.35rem;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.07);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-top: 3px solid var(--secondary-color);

  @media (min-width: 992px) {
    padding: 1.85rem 2rem;
  }
}

/* Contenido enriquecido desde el backend (HTML). */
.quienes-somos-page__prose {
  font-size: 1rem;
  line-height: 1.65;
  color: #333;

  p {
    margin-bottom: 1rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  h2,
  h3,
  h4 {
    font-weight: 700;
    color: #1a1a1a;
    margin-top: 1.35rem;
    margin-bottom: 0.65rem;
    line-height: 1.3;

    &:first-child {
      margin-top: 0;
    }
  }

  h2 {
    font-size: 1.35rem;
  }

  h3 {
    font-size: 1.15rem;
  }

  h4 {
    font-size: 1.05rem;
  }

  ul,
  ol {
    margin: 0 0 1rem;
    padding-left: 1.35rem;
  }

  li {
    margin-bottom: 0.35rem;
  }

  a {
    color: var(--secondary-color);
    font-weight: 600;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
      color: var(--primary-color);
    }
  }

  strong {
    font-weight: 700;
    color: #222;
  }

  img {
    max-width: 100%;
    height: auto;
    border-radius: 10px;
    margin: 0.75rem 0;
  }

  blockquote {
    margin: 1rem 0;
    padding: 0.75rem 1rem;
    border-left: 4px solid var(--secondary-color);
    background: rgba(0, 0, 0, 0.03);
    color: #444;
    font-style: normal;
  }
}
</style>
