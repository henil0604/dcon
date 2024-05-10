<script lang="ts">
	import FileSystemRenderer from '$lib/components/FileSystemRenderer.svelte';
	import { trpc } from '$lib/trpc/client';
	import { onMount } from 'svelte';
	import { fetchEventSource } from '@microsoft/fetch-event-source';

	async function test() {
		const form = new FormData();
		let data = new Array(Math.ceil(1024 * 1024 * 0.1)).fill('A').join('');
		form.set('file', new File([data], 'hello.txt'));

		let localFileUploadResponse = await fetch('/api/upload', {
			body: form,
			method: 'POST'
		});

		const fileId = (await localFileUploadResponse.json()).data.id;

		console.log(fileId);

		const response = trpc().drive.upload.mutate({
			fileId,
			fileInfo: {
				name: 'hello.txt',
				mimeType: 'text/plain'
			}
		});

		response.then(console.log);

		const source = await fetchEventSource(`/api/upload/progress?fileId=${fileId}`, {
			async onopen(response) {
				console.log(response);
			},
			onmessage(event) {
				console.log(JSON.parse(event.data));
			},
			onclose() {
				console.log('closed');
			},
			onerror(err) {
				console.log('ERR', err);
			},
			method: 'GET',
			headers: {
				Accept: 'text/event-stream'
			},
			openWhenHidden: true
		});

		console.log(source);
	}

	onMount(() => {
		test();
	});
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
