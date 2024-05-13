<script lang="ts">
	import { Progress } from '$lib/components/ui/progress';
	import { File as FileIcon } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';
	import { slide } from 'svelte/transition';

	export let isMoreInfoOpened = false;
	export let fileName;
	export let showMiniProgressBar: boolean = true;
	export let miniProgressBarValue: number = 0;

	let dispatch = createEventDispatcher();

	function handleToggleMoreInfo() {
		isMoreInfoOpened = !isMoreInfoOpened;
		dispatch('toggleMoreInfo', isMoreInfoOpened);
	}
</script>

<div
	class="file-progress-item"
	role="button"
	tabindex="0"
	on:keyup={(e) => (e.code === 'Enter' || e.code === 'Space') && handleToggleMoreInfo()}
	on:click={handleToggleMoreInfo}
	class:as-button={$$slots.moreInfo}
>
	<!-- basic info -->
	<div class="basic-info">
		<!-- head -->
		<div class="head">
			{#if $$slots.icon}
				<slot name="icon" />
			{:else}
				<FileIcon />
			{/if}
		</div>
		<!-- content -->
		<div class="body">
			<div class="file-name">
				{fileName}
			</div>
			{#if showMiniProgressBar}
				<div class="mini-progress-bar-wrapper">
					<Progress
						class="h-2 rounded-none border border-gray-400"
						value={miniProgressBarValue}
						max={100}
					/>
				</div>
			{/if}
		</div>
		<!-- tail -->
		{#if $$slots.tail}
			<div class="tail">
				<slot name="tail" />
			</div>
		{/if}
	</div>
	<!-- more info -->
	{#if isMoreInfoOpened && $$slots.moreInfo}
		<div class="more-info" transition:slide|local={{ duration: 100 }}>
			<slot name="moreInfo" />
		</div>
	{/if}
</div>

<style lang="scss">
	.file-progress-item {
		display: flex;
		flex-direction: column;
		padding: theme('padding.4');
		gap: theme('gap.3');
		background-color: theme('backgroundColor.background');

		&.as-button:hover {
			background-color: theme('backgroundColor.secondary.DEFAULT');
		}
	}

	.file-progress-item .basic-info {
		display: flex;
		flex-direction: row;
		gap: theme('gap.3');
		align-items: center;

		.body {
			flex-grow: 1;
			font-size: theme('fontSize.base');
			gap: theme('gap.1');

			.file-name {
				max-width: 25ch;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}
	}

	.file-progress-item .more-info {
		display: flex;
		flex-direction: column;
	}
</style>
