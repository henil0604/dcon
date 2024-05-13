<script>
	import { CloudUpload } from 'lucide-svelte';
	import { slide } from 'svelte/transition';
</script>

<div
	transition:slide|local={{ duration: 150 }}
	class="absolute bottom-0 left-1/2 flex h-fit w-fit -translate-x-1/2 flex-col items-center justify-center gap-3"
>
	<CloudUpload size={40} />
	<div class="h-full w-full rounded-full bg-primary p-4 px-10 text-sm text-primary-foreground">
		Drop those juicy files
	</div>
</div>
