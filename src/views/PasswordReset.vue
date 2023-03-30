<template>
	<b-row
	class="auth login m-b-0 m-sm-b-30">
		<b-col 
		class="col-form"
		cols="12"
		sm="8"
		md="8"
		lg="6"
		xl="4">
			<img 
			@click="home"
			class="apretable c-p"
			src="@/assets/icon.png" 
			:alt="commerce.company_name">
			<form-password-reset></form-password-reset>
		</b-col>
	</b-row>
</template>
<script>
import nav from '@/mixins/nav'
import FormPasswordReset from '@/components/password-reset/components/Form'
export default {
	name: 'Register',
	mixins: [nav],
	components: {
		FormPasswordReset,
	},
}
</script>