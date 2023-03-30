<template>
	<div
	class="back-button-title">
		<back-button
		v-if="isSearchView && is_mobile"></back-button>
		<b-navbar-brand 
		v-show="!isSearchView"
		class="m-0 p-r-15 d-lg-none p-r">
			<span 
			v-b-toggle.nav-sidebar
			class="icon-bars p-r-5"></span> 
            <b-badge
            v-show="cupons_not_read > 0"
            class="badge"
            variant="danger">
                {{ cupons_not_read }}
            </b-badge>
            <!-- En ambas img estaba logo-blanco -->
			<img 
			@click="home"
			class="img-brand-mobile m-l-5 apretable"
            src="@/assets/icon.png"
			alt="logo">
		</b-navbar-brand>
		<b-navbar-brand 
		@click="home"
		class="m-0 p-r-15 apretable c-p d-none d-lg-flex">
			<img 
			class="img-brand-desktop"
            src="@/assets/icon.png"
			alt="logo">
		</b-navbar-brand>
	</div>
</template>
<script>
import BackButton from '@/components/common/BackButton'
import nav_mixin from '@/mixins/nav'
export default {
	mixins: [nav_mixin],
	components: {
		BackButton,
	},
	computed: {
		title() {
			return this.$store.state.generals.title
		},
	}
}
</script>
<style lang="sass">
@import '@/sass/_custom.scss'
.back-button-title
	.icon-bars
		@if ($theme == dark) 
			color: #fff
		@else if ($theme == ligth) 
			color: rgba(0, 0, 0, .7)
	.navbar-brand
		padding: 0
		@media screen and (min-width: 992px)
			width: 150px
			justify-content: center
			// justify-content: start
			align-items: center
	.back-button-title
		// width: 200px
	.icon-back
		padding-top: 1em
	.img-brand-mobile
		width: 70px
		// width: 70px
		margin-right: .5em
	.img-brand-desktop
		// width: 120px
		max-height: 90px
		margin-right: .5em
	.badge 
		margin-left: -10px
		margin-top: 5px
		font-size: .6em
</style>