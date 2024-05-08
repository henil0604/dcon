<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { File, Folder, Plus } from 'lucide-svelte';

	function handleNewFolder() {
		// TODO: implement logic
	}

	function handleNewFile() {
		// TODO: implement logic
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<Button class="h-fit p-2" size="sm"><Plus size={18} /></Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Group>
			<DropdownMenu.Item on:click={handleNewFolder}>
				<Folder class="mr-2 h-4 w-4" />
				<span>New Folder</span>
			</DropdownMenu.Item>
			<DropdownMenu.Item on:click={handleNewFile}>
				<File class="mr-2 h-4 w-4" />
				<span>New File</span>
			</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
