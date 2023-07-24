<template>
<b-skeleton-wrapper :loading="loading">
	<template v-slot:loading>
		<b-card
		class="card-skeleton m-b-15">
			<b-skeleton type="button" width="70%" class="m-b-15"></b-skeleton>
			<b-skeleton type="button" width="40%" class="m-b-15"></b-skeleton>
			<b-skeleton type="button" width="100%"></b-skeleton>
		</b-card>
	</template>
	<div
	class="m-t-20 m-b-20"
	v-if="article_to_show">
		<name-heart></name-heart>
		
		<discounts></discounts>	

		<price></price>
		
		<payment-methods-info></payment-methods-info>

		<condition></condition>	

		<sold-out-info></sold-out-info>

		<add-to-cart></add-to-cart>
		
		<whatsapp-link></whatsapp-link>
	</div>
</b-skeleton-wrapper>
</template>
<script>
import NameHeart from '@/components/article/components/data/NameHeart'
import Discounts from '@/components/article/components/data/Discounts'
import PaymentMethodsInfo from '@/components/article/components/data/PaymentMethodsInfo'
import Price from '@/components/article/components/data/Price'
import Condition from '@/components/article/components/data/Condition'
import SoldOutInfo from '@/components/article/components/data/SoldOutInfo'
import AddToCart from '@/components/article/components/data/AddToCart'
import WhatsappLink from '@/components/article/components/data/WhatsappLink'

import BtnLoader from '@/components/common/BtnLoader'
export default {
	name: 'ArticleData',
	components: {
		NameHeart,
		Discounts,
		PaymentMethodsInfo,
		Price,
		Condition,
		SoldOutInfo,
		AddToCart,
		WhatsappLink,

		BtnLoader,
	},
	computed: {
		loading() {
			return this.$store.state.articles.loading_article_to_show
		},
	},
}
</script>
