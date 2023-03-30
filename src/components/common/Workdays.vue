<template>
	<div 
	class="workdays">
		<p>Nuestros horarios son:</p>
		<div
		v-for="workday in workdays"
		:key="workday.id">
			<p
			class="workday">
				{{ workday.name.toUpperCase() }}
			</p>
			<div
			v-if="workday.schedules.length">
				<p
				class="schedule"
				v-for="schedule in workday.schedules">
					De {{ hour_from_time(schedule.from) }}hs a {{ hour_from_time(schedule.to) }}hs.
				</p>
			</div>
			<p
			class="schedule"
			v-else>
				Cerrado
			</p>
		</div>
		<p>
			<strong>
				Si haces tu pedido, lo procesaremos cuando el local este abierto.
			</strong>
		</p>
	</div>
</template>
<script>
export default {
	computed: {
		workdays() {
			return this.$store.state.commerce.workdays
		}
	}
}
</script>
<style lang="sass">
.workdays
	p 
		text-align: left
	.workday 
		font-weight: bold
		margin-bottom: 0
	.schedule
		margin-bottom: 0
	.schedule:last-child
		margin-bottom: 1em
</style>