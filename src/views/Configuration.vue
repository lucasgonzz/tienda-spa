<template>
	<div class="view">
		<name></name>
		<phone></phone>
		<email></email>
		<password></password>
		<b-row
		v-if="user">
			<b-col
			cols="12">
				<user-data></user-data>
			</b-col>
			<b-col
			cols="12"
			lg="6">
				<menu-items></menu-items>
			</b-col>
		</b-row>
	</div>
</template>
<script>
import UserData from '@/components/configuration/components/UserData'
import MenuItems from '@/components/configuration/components/Menu'
import Name from '@/components/configuration/modals/Name'
import Phone from '@/components/configuration/modals/Phone'
import Email from '@/components/configuration/modals/Email'
import Password from '@/components/configuration/modals/Password'
export default {
	components: {
		UserData,
		MenuItems,
		Name,
		Phone,
		Email,
		Password,
	},
	created() {
		this.setTitle('Mi cuenta')
	}
}
</script>