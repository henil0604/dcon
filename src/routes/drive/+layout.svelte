<script lang="ts">
	import { page } from '$app/stores';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import AppLayout from '$lib/components/layout/AppLayout.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Plus } from 'lucide-svelte';
</script>

<AppLayout>
	<!-- body -->
	<div class="bodyWrapper">
		<!-- top bar -->
		<div class="flex">
			<!-- breadcrumb -->
			<div class="flex-grow">
				<Breadcrumb />
			</div>

			<!-- tail -->
			<div class="flex">
				<Button class="h-fit p-2" size="sm"><Plus size={18} /></Button>
			</div>
		</div>

		<hr class="my-4" />

		<slot />
	</div>
</AppLayout>

<style lang="scss">
	.bodyWrapper {
		display: flex;
		flex-direction: column;
		padding: theme('padding.6') theme('padding.6');
	}
</style>
