<template>
	<div>
		<div
		v-if="!loading">
			<div
			v-if="platelets.length"
			class="p-l-25 p-r-25">
				<carousel
				class="m-b-10"
				autoplay
				:navigationEnabled="!is_mobile"
				navigationNextLabel="<i class='icon-right'></i>"
				navigationPrevLabel="<i class='icon-left'></i>"
				:paginationActiveColor="variant_color"
				paginationColor="#A9A9A9"
				:paginationPadding="5"
				loop
				:autoplayTimeout="5000"
				:perPage="1"
				:adjustableHeight="true">
					<slide
					v-for="(platelet, index) in platelets"
					:data-index="index"
					:key="platelet.id">
						<platelet
						:platelet="platelet"></platelet>	
					</slide>
				</carousel>
			</div>
		</div>
		<!-- <div
		v-else>
			<platelet-skeleton></platelet-skeleton>
		</div> -->
	</div>
</template>
<script>
import { Carousel, Slide } from 'vue-carousel'
import Platelet from '@/components/home/components/platelets/Platelet'
import PlateletSkeleton from '@/components/home/components/platelets/Skeleton'
export default {
	components: {
	    Carousel,
	    Slide,
	    Platelet,
	    PlateletSkeleton,
	},
	computed: {
		platelets() {
			return this.$store.state.platelets.models
		},
		loading() {
			return this.$store.state.platelets.loading
		},
	}
}
</script>
<style lang="sass">
.platelet 
	max-width: 400px	
	margin: auto
	padding: 1em
	.name 
		font-weight: bold
		font-size: 1.2em
	.description
		text-align: center
		font-size: 1em
</style>