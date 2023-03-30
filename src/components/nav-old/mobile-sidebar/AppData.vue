<template>
    <div 
    v-if="!authenticated"
    class="user-data">
        <div class="app-image">
            <img 
            src="@/assets/icon.png">
        </div>
        <p class="name">
            Bienvenido a {{ commerce.company_name }}
        </p>
    </div>
</template>
<script>
export default {
	computed: {
		user_letter() {
			return this.user.name.charAt(0).toUpperCase()
		}
	}
}
</script>
<style lang="sass">
.user-data
    p
        color: rgba(0,0,0,.8)
</style>