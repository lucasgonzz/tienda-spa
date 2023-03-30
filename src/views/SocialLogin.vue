<template>
	<div class="view">
		<b-button
		block
		@click="authProvider('google')">
			<btn-loader
			text="Google"
			:loader="loading">
			</btn-loader>
		</b-button>
		<b-button
		block
		@click="authProvider('facebook')">
			Facebook
		</b-button>
	</div>
</template>
<script>
import BtnLoader from '@/components/common/BtnLoader'
export default {
	components: {
		BtnLoader,
	},
	data() {
		return {
			loading: false,
		}
	},
	methods: {
		authProvider(provider) {
			let self = this
			this.$auth.authenticate(provider).then(response => {
				self.socialLogin(provider, response)
			}).catch(err => {
				console.log({err:err})
			})
		},
		socialLogin(provider, response) {
			console.log('response de google:')
			console.log(response)
			this.loading = true
			this.$axios.post('/sociallogin/'+provider, response)
			.then(res => {
				console.log('response despues de registrar el usuario')
				console.log(res)
				this.$store.dispatch('auth/me')
				.then(() => {
					this.loading = false
				})
			}).catch(err => {
				console.log({err:err})
			})
		}
	}
}
</script>