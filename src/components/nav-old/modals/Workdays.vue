<template>
<b-modal
title="Horarios de comercio"
id="workdays"
hide-footer
scrollable>
	<workdays></workdays>	
</b-modal>
</template>
<script>
import Workdays from '@/components/common/Workdays'
export default {
	components: {
		Workdays,
	}
}
</script>