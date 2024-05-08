<script lang="ts">
	import { File, Folder } from 'lucide-svelte';

	interface Entity {
		name: string;
		type: 'DIR' | 'FILE';
		id: string;
		onClick?: () => any;
	}

	export let entities: Entity[] = [];

	// sort entities by type
	$: entities = entities.sort((a, b) => (a.type === 'DIR' ? -1 : 0));

	function handleEntityClick(entity: Entity) {
		// TODO: implement logic
		console.log(entity);
	}
</script>

<div class="grid">
	{#each entities as entity (entity.id)}
		<div
			role="button"
			tabindex="0"
			on:keyup={(e) => e.code === 'Enter' && handleEntityClick(entity)}
			on:click={() => handleEntityClick(entity)}
			class="entity {entity.type.toLowerCase()}"
		>
			<span class="icon" title={entity.type}>
				{#if entity.type === 'DIR'}
					<Folder />
				{:else}
					<File />
				{/if}
			</span>
			<span title={entity.name} class="name">{entity.name}</span>
		</div>
	{/each}
</div>

<style lang="scss">
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: theme('gap.4');

		.entity {
			@apply rounded-md border;
			width: 100%;
			padding: theme('padding.3') theme('padding.4');
			display: flex;
			justify-content: start;
			gap: theme('gap.3');
			cursor: pointer;

			.name {
				overflow: hidden;
				text-overflow: ellipsis;
				text-wrap: nowrap;
			}

			&.dir {
				background-color: theme('backgroundColor.gray.100');
			}

			&.file {
			}
		}
	}
</style>
