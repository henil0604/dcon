<script lang="ts">
	import { ROUTES } from '$lib/const';
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Home, PanelLeft } from 'lucide-svelte';
	import { page } from '$app/stores';

	const links = [
		{
			name: 'Home',
			icon: Home,
			href: ROUTES.DRIVE
		}
	];
</script>

<div class="wrapper">
	<div class="sidebar">
		<!-- head -->
		<div class="head">
			<slot name="navHead">
				<a href={ROUTES.DRIVE}>D</a>
			</slot>
		</div>
		<hr />
		<!-- links -->
		<div class="links">
			{#each links as link (link.name)}
				{@const isActive = link.href === $page.url.pathname}
				<a class="linkItem" class:active={isActive} href={link.href}>
					<svelte:component this={link.icon} size={18} class="font-bold" />
				</a>
			{/each}
		</div>
		{#if $$slots.navTail}
			<hr />
		{/if}
		<!-- tail -->
		<div class="tail">
			<slot name="navTail" />
		</div>
	</div>

	<div class="topbar">
		<div class="head">
			<Sheet.Root>
				<Sheet.Trigger>
					<Button size="sm" variant="outline" class="p-2">
						<PanelLeft size={18} />
					</Button>
				</Sheet.Trigger>
				<Sheet.Content side="left" class="w-full ">
					<Sheet.Header>
						<Sheet.Title class="text-left">DCon</Sheet.Title>
						<hr />
						<div class="!mt-8 flex flex-col gap-4">
							{#each links as link (link.name)}
								{@const isActive = link.href === $page.url.pathname}
								<a
									class="flex gap-4 rounded p-3 {isActive
										? 'bg-primary text-primary-foreground'
										: ''}"
									href={link.href}
								>
									<svelte:component this={link.icon} size={20} class="font-bold" />
									<p>{link.name}</p>
								</a>
							{/each}
						</div>
					</Sheet.Header>
				</Sheet.Content>
			</Sheet.Root>
		</div>

		<!-- tail -->
		<div class="tail">
			<slot name="navTail" />
		</div>
	</div>

	<div class="body">
		<slot />
	</div>
</div>

<style lang="scss">
	.wrapper {
		display: flex;
		flex-direction: row;
		width: 100%;
		height: 100%;

		.body {
			flex-grow: 1;
		}

		hr {
			@apply my-2;
			width: 100%;
		}
	}

	.wrapper > .sidebar {
		@apply border-r;
		padding: theme('padding.4') theme('padding.4');
		min-width: theme('minWidth.16');
		display: flex;
		flex-direction: column;
		align-items: center;

		.head {
			a {
				font-size: theme('fontSize.3xl');
				font-weight: theme('fontWeight.black');
			}
		}

		.links {
			@apply my-2;
			flex-grow: 1;
			display: flex;
			flex-direction: column;

			.linkItem {
				@apply my-2 rounded-full p-2 text-muted-foreground;

				&.active {
					@apply bg-primary text-primary-foreground;
				}

				&:not(.active):hover {
					@apply text-primary;
				}
			}
		}
	}

	.wrapper > .topbar {
		@apply border-b;
		display: none;

		padding: theme('padding.2') theme('padding.2');
		min-height: theme('minHeight.12');

		.head {
			flex-grow: 1;
		}
	}

	@media only screen and (width < 676px) {
		.wrapper {
			flex-direction: column;
		}

		.wrapper > .sidebar {
			display: none;
		}
		.wrapper > .topbar {
			display: flex;
		}
	}
</style>
