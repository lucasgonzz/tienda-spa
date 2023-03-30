<template>
	<b-row
	class="auth login p-t-20 m-b-0 m-sm-b-30">
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
			<form-register></form-register>
			<verify-code></verify-code>
		</b-col>
	</b-row>
</template>
<script>
import nav from '@/mixins/nav'
import FormRegister from '@/components/register/components/Form'
import VerifyCode from '@/components/register/components/VerifyCode'
export default {
	name: 'Register',
	mixins: [nav],
	components: {
		FormRegister,
		VerifyCode,
	},
}
</script>