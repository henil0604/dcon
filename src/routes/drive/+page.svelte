<script lang="ts">
	import FileSystemRenderer from '$lib/components/FileSystemRenderer.svelte';
	import { dropzone } from '$lib/utils/frontend/dropzone';
	import DropzoneOverlayPopup from '$lib/components/DropzoneOverlayPopup.svelte';
	import { handleFileUpload } from '$lib/utils/frontend/upload';

	let showFileDropzoneOverlay = false;
</script>

<div
	class="relative h-full w-full"
	use:dropzone={{
		onDraggingChange(isDragging) {
			showFileDropzoneOverlay = isDragging;
		},
		handleFiles: (files) => {
			if (files.length === 0) {
				return;
			}

			let filesArray = Array.from(files);

			for (const file of filesArray) {
				const factory = handleFileUpload(file);
				factory.start();
			}
		}
	}}
>
	{#if showFileDropzoneOverlay}
		<DropzoneOverlayPopup />
	{/if}
	<FileSystemRenderer
		entities={[
			{
				name: 'Untitled Folder',
				id: '123',
				type: 'DIR'
			},
			{
				name: 'Hello World',
				id: '456',
				type: 'FILE'
			}
		]}
	/>
</div>
