<template>
	<b-row
	class="view-p-t">
		<b-col
		cols="12"
		lg="10"
		xl="8">
			<h3
			class="m-b-25">
				{{ commerce.online_configuration.titulo_quienes_somos }}
			</h3>
			<p
			v-html="commerce.online_configuration.quienes_somos"
			class="text-left">
			</p>
		</b-col>
	</b-row>
</template>