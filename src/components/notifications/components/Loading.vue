<template>
	<b-list-group>
		<b-list-group-item
		v-for="i in 7"
		:key="i">
			<b-skeleton width="100%"></b-skeleton>
			<b-skeleton class="float-right" width="15%"></b-skeleton>
		</b-list-group-item>
	</b-list-group>
</template>