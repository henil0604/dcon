<script lang="ts">
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import TopbarNewButton from '$lib/components/TopbarNewButton.svelte';
	import AppLayout from '$lib/components/layout/AppLayout.svelte';
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
				<TopbarNewButton />
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
