<template>
    <div 
    v-if="authenticated"
    class="user-data">
        <div class="image">
            <img 
            v-if="user.avatar"
            :src="user.avatar">
            <span
            v-else>
                {{ user_letter }}
            </span>
        </div>
        <p class="name">
            {{ user.name }} {{ user.surname }}
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