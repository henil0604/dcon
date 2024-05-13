import { writable } from 'svelte/store';

export function dropzone(
	node: HTMLElement,
	options?: {
		onDraggingChange: (isDragging: boolean) => any;
		handleFiles?: (files: FileList) => any;
	}
) {
	let dragging = writable(false);

	options?.onDraggingChange && dragging.subscribe(options?.onDraggingChange);

	function preventDefaults(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
	}

	function handleDragEnter(event: DragEvent) {
		preventDefaults(event);
		dragging.set(true);
	}

	function handleDragOver(event: DragEvent) {
		preventDefaults(event);
		dragging.set(true);
	}

	function handleDragLeave(event: DragEvent) {
		preventDefaults(event);
		dragging.set(false);
	}

	function handleDrop(event: DragEvent) {
		preventDefaults(event);
		dragging.set(false);
		if (event.dataTransfer?.files) {
			options?.handleFiles?.(event.dataTransfer.files);
		}
	}

	node.addEventListener('dragenter', handleDragEnter, {
		capture: false
	});

	node.addEventListener('dragover', handleDragOver, {
		capture: false
	});

	node.addEventListener('dragleave', handleDragLeave, {
		capture: false
	});

	node.addEventListener('drop', handleDrop, {
		capture: false
	});

	return {
		destroy() {
			node.removeEventListener('dragenter', handleDragEnter);
			node.removeEventListener('dragover', handleDragOver);
			node.removeEventListener('dragleave', handleDragLeave);
			node.removeEventListener('drop', handleDrop);
		}
	};
}
