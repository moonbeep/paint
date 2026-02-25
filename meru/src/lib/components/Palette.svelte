<script lang="ts">
	import { PALETTE } from '$lib/utils/colors';

	let { selectedColor = $bindable() } = $props<{
		selectedColor: number;
	}>();
</script>

<div
	class="grid max-h-full min-w-max grid-cols-1 gap-2 overflow-y-auto scroll-smooth rounded-md border border-gray-200 bg-white/90 p-2 shadow-xl backdrop-blur"
>
	{#each PALETTE as color, index (index)}
		<button
			class="h-8 w-8 rounded-sm border-2 transition-transform hover:scale-110"
			style="background-color: {color}; border-color: {selectedColor === index
				? 'black'
				: 'transparent'};"
			onclick={() => (selectedColor = index)}
			aria-label={`Select color ${index}`}
		></button>
	{/each}
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
</style>
