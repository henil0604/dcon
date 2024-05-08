<script lang="ts">
	import { page } from '$app/stores';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { ROUTES } from '$lib/const';

	interface DirectoryItem {
		name: string;
		id: string;
	}

	export let directories: DirectoryItem[] = [];
</script>

<Breadcrumb.Root>
	<Breadcrumb.List>
		<Breadcrumb.Item>
			{#if $page.url.pathname === ROUTES.DRIVE}
				<Breadcrumb.Page class="text-xl">Home</Breadcrumb.Page>
			{:else}
				<Breadcrumb.Link href={ROUTES.DRIVE} class="text-xl">Home</Breadcrumb.Link>
			{/if}
		</Breadcrumb.Item>
		<Breadcrumb.Separator />

		{#each directories as dir (dir.id)}
			{@const href = `${ROUTES.DRIVE}/${dir.id}`}
			{@const isActive = $page.url.pathname === href}
			{@const component = isActive ? Breadcrumb.Page : Breadcrumb.Link}
			<Breadcrumb.Item>
				<svelte:component this={component} class="text-xl" {href}>{dir.name}</svelte:component>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
		{/each}
	</Breadcrumb.List>
</Breadcrumb.Root>
