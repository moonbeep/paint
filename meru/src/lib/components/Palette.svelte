<script lang="ts">
	import { slide } from 'svelte/transition';

	import { PALETTE } from '$lib/utils/colors';
	import Icon from './Icon.svelte';

	let { selectedColor = $bindable() } = $props<{
		selectedColor: number;
	}>();

	let offset = $state(0);

	function prevPage() {
		if (offset >= 16) offset -= 16;
	}

	function nextPage() {
		if (offset + 16 < PALETTE.length) offset += 16;
	}
</script>

<div
	class="grid max-h-full min-w-max grid-cols-1 gap-2 overflow-y-auto scroll-smooth rounded-md bg-white p-2 shadow-md backdrop-blur"
>
	{#if offset !== 0}
		<div transition:slide>
			<Icon onclick={prevPage} disabled={offset === 0} name="arrow-up-circle" size={8} />
		</div>
	{/if}

	{#each PALETTE.slice(offset, offset + 16) as color, index (index)}
		{@const absoluteIndex = offset + index}
		<button
			class="h-8 w-8 rounded-sm border-2 transition-transform hover:scale-110"
			class:border-contrast={selectedColor === absoluteIndex}
			class:border-transparent={selectedColor !== absoluteIndex}
			class:white-box={absoluteIndex === 0 && selectedColor !== absoluteIndex}
			style="background-color: {color};"
			onclick={() => (selectedColor = absoluteIndex)}
			aria-label={`Select color ${absoluteIndex}`}
		></button>
	{/each}

	{#if offset + 16 < PALETTE.length}
		<div transition:slide>
			<Icon
				onclick={nextPage}
				disabled={offset + 16 >= PALETTE.length}
				name="arrow-down-circle"
				size={8}
			/>
		</div>
	{/if}
</div>

<style>
	/* Hide scrollbar for a cleaner look while keeping functionality */
	div::-webkit-scrollbar {
		width: 4px;
	}
	div::-webkit-scrollbar-thumb {
		background: #d1d5db;
		border-radius: 10px;
	}
	.white-box {
		border-color: var(--color-subtext);
	}
</style>
