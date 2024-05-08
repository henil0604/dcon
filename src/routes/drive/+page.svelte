<script>
	import FileSystemRenderer from '$lib/components/FileSystemRenderer.svelte';
</script>

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
