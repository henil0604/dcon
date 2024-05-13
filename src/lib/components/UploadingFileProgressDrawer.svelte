<script lang="ts">
	import {
		preparingDriveUploadingFilesQueue,
		uploadingFilesDone,
		uploadingFilesInProgress,
		uploadingFilesQueue,
		uploadingFilesWaiting
	} from '$lib/store/upload';
	import { CheckIcon, X } from 'lucide-svelte';
	import { slide } from 'svelte/transition';
	import { Circle } from 'svelte-loading-spinners';
	import bytes from 'bytes';
	import FileProgressItem from '$lib/components/FileProgressItem.svelte';
	import { Button } from '$lib/components/ui/button';

	export let open = false;

	export let openedItemId: string | null = '123';

	$: preparingDriveUploadingFilesQueueLength = Object.keys(
		$preparingDriveUploadingFilesQueue
	).length;
	$: uploadingFilesInProgressLength = Object.keys($uploadingFilesInProgress).length;
	$: uploadingFilesWaitingLength = Object.keys($uploadingFilesWaiting).length;
	$: uploadingFilesDoneLength = Object.keys($uploadingFilesDone).length;
	$: uploadingFilesQueueLength = Object.keys($uploadingFilesQueue).length;

	$: isIdle =
		preparingDriveUploadingFilesQueueLength === 0 &&
		uploadingFilesInProgressLength === 0 &&
		uploadingFilesWaitingLength === 0;

	$: showDrawer = uploadingFilesQueueLength > 0 || preparingDriveUploadingFilesQueueLength > 0;

	function toggleOpen() {
		open = !open;
	}

	function handleToggleMoreInfo(id: string) {
		openedItemId = openedItemId === id ? null : id;
	}

	function handleClose(event: MouseEvent) {
		event.stopPropagation();

		// TODO: handle abort all file upload
		if (!isIdle) {
			return;
		}

		$uploadingFilesQueue = {};
	}
</script>

{#if showDrawer}
	<div transition:slide|local={{ duration: 200 }} class="wrapper">
		<!-- open tab -->
		<div
			on:keyup={(e) => (e.code === 'Enter' || e.code === 'Space') && toggleOpen()}
			on:click={toggleOpen}
			tabindex="0"
			role="button"
			class=""
		>
			<div>
				{#if preparingDriveUploadingFilesQueueLength + uploadingFilesInProgressLength + uploadingFilesWaitingLength > 0}
					{@const length =
						uploadingFilesInProgressLength +
						uploadingFilesWaitingLength +
						preparingDriveUploadingFilesQueueLength}
					Uploading {length} file{length > 1 ? 's' : ''}
				{:else}
					{@const length = uploadingFilesDoneLength}
					Uploaded {length} file{length > 1 ? 's' : ''}
				{/if}
			</div>
			{#if isIdle}
				<div>
					<Button on:click={handleClose} variant="ghost" class="h-fit w-fit rounded-full p-2">
						<X size={16} />
					</Button>
				</div>
			{/if}
		</div>
		<!-- tab space -->
		{#if open}
			<div transition:slide|local={{ duration: 100 }} class="progress-items-wrapper">
				{#if preparingDriveUploadingFilesQueueLength > 0}
					<div class="p-2 text-sm font-semibold text-muted-foreground">
						Uploading to DCon Server...
					</div>
					<div>
						{#each Object.entries($preparingDriveUploadingFilesQueue) as [key, data]}
							<FileProgressItem
								fileName={data.file.name}
								isMoreInfoOpened={false}
								miniProgressBarValue={data.progress.percentage}
								showMiniProgressBar
							>
								<svelte:fragment slot="tail">
									{#if data.progress.status === 'WAITING'}
										<Circle size="20" />
									{/if}
									{#if data.progress.status === 'UPLOADING'}
										{data.progress.percentage}%
									{/if}
									{#if data.progress.status === 'DONE'}
										<CheckIcon color="green" />
									{/if}
								</svelte:fragment>
							</FileProgressItem>
						{/each}
					</div>
				{/if}
				{#if uploadingFilesQueueLength > 0}
					<div class="p-2 text-sm font-semibold text-muted-foreground">
						Uploading to Google Drive...
					</div>
					<div>
						{#each Object.entries($uploadingFilesQueue) as [key, data]}
							{@const isItemOpen = openedItemId === key}
							{@const showMiniProgressBar = data.progress.status === 'UPLOADING'}

							<FileProgressItem
								on:toggleMoreInfo={() => handleToggleMoreInfo(key)}
								fileName={data.file.name}
								isMoreInfoOpened={isItemOpen}
								miniProgressBarValue={data.progress.percentage}
								{showMiniProgressBar}
							>
								<svelte:fragment slot="tail">
									{#if data.progress.status === 'WAITING'}
										<Circle size="20" />
									{/if}
									{#if data.progress.status === 'UPLOADING'}
										{data.progress.percentage}%
									{/if}
									{#if data.progress.status === 'DONE'}
										<CheckIcon color="green" />
									{/if}
								</svelte:fragment>
								<svelte:fragment slot="moreInfo">
									<div class="more-info-item">
										<span>Status:</span>
										<span>
											{data.progress.status}
										</span>
									</div>
									<div class="more-info-item">
										<span>Uploaded:</span>
										<span>
											{bytes.format(data.progress.bytesUploaded)} of {bytes(
												data.progress.totalBytes
											)}
										</span>
									</div>
									<div class="more-info-item">
										<span>ID:</span>
										<span
											title={key}
											class="max-w-[15ch] overflow-hidden text-ellipsis whitespace-nowrap"
										>
											{key}
										</span>
									</div>
									<div class="my-3"></div>
									<div class="text-sm">Chunks:</div>
									<div class="my-1"></div>
									<div class="more-info-chunk-grid">
										{#each Object.entries(data.progress.chunks) as [index, chunkData]}
											<div
												class="chunk"
												title={chunkData.status}
												class:failed={chunkData.status === 'FAILED'}
												style="--chunk-progress: {chunkData.percentage}%;"
											>
												{#if chunkData.status !== 'FAILED'}
													<div class="progress"></div>
												{/if}
											</div>
										{/each}
									</div>
								</svelte:fragment>
							</FileProgressItem>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style lang="scss">
	.wrapper {
		display: flex;
		flex-direction: column;
		position: fixed;
		bottom: 0;
		right: 50px;
		min-width: 400px;
		max-width: 60%;
		z-index: 10;
	}

	.wrapper > [role='button'] {
		@apply rounded-t-lg bg-primary text-primary-foreground;
		padding: theme('padding.4') theme('padding.6');
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.wrapper .progress-items-wrapper {
		@apply border-x;
		display: flex;
		flex-direction: column;

		.more-info-item {
			@apply grid-cols-2;
			display: grid;
			max-width: 70%;
			font-size: theme('fontSize.sm');

			:nth-child(1) {
				max-width: fit-content;
			}
		}

		.more-info-chunk-grid {
			display: grid;
			--chunk-size: 15px;
			grid-template-columns: repeat(auto-fill, minmax(var(--chunk-size), 1fr));
			width: 100%;
			background-color: theme('backgroundColor.gray.100');
			padding: theme('padding.1');
			gap: theme('gap.1');

			.chunk {
				min-width: var(--chunk-size);
				min-height: var(--chunk-size);
				background-color: theme('backgroundColor.blue.300');
				border-radius: 2px;
				overflow: hidden;

				&.failed {
					background-color: theme('backgroundColor.red.700');
				}

				.progress {
					width: var(--chunk-progress, 0%);
					font-size: 10px;
					height: 100%;
					background-color: theme('backgroundColor.blue.700');
				}
			}
		}
	}

	@media only screen and (width < 767px) {
		.wrapper {
			min-width: 100%;
			right: 0;
		}

		.wrapper > [role='button'] {
			padding: theme('padding.3') theme('padding.4');
		}
	}
</style>
