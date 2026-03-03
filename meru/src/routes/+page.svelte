<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	import Palette from '$lib/components/Palette.svelte';
	import Editor from '$lib/components/Editor.svelte';
	import Button from '$lib/components/Button.svelte';
	import { BANNER } from '$lib/constants';

	let showToolTip: boolean = $state(true);
	let toolTipMessage: string = $state('Scroll to Zoom • Right Click to Pan');
	let toolTipTimerId: number = 0;

	let selectedColor = $state(1);
	let resetCanvas: () => string = $state(() => '');
	let downloadCanvas: () => string = $state(() => '');
	let brushIncrease: () => string = $state(() => '');
	let brushDecrease: () => string = $state(() => '');

	// Initial Load
	onMount(async () => {
		toolTipTimerId = window.setTimeout(() => (showToolTip = false), 5000);
	});

	const toolTipWrapper = (func: () => string) => {
		return () => {
			const response: string = func();
			if (response == '') return;

			toolTipMessage = response;
			showToolTip = true;
			window.clearTimeout(toolTipTimerId);
			toolTipTimerId = window.setTimeout(() => (showToolTip = false), 5000);
		};
	};

	console.log(BANNER + '\nVersion:', __APP_VERSION__, '\nRelease date:', __BUILD_TIME__);
</script>

<main class="h-screen w-screen overflow-hidden bg-backdrop font-sans">
	<div class="z-0">
		<Editor
			bind:selectedColor
			bind:triggerReset={resetCanvas}
			bind:triggerDownload={downloadCanvas}
			bind:triggerBrushIncrease={brushIncrease}
			bind:triggerBrushDecrease={brushDecrease}
		/>
	</div>

	<div
		class="pointer-events-none fixed inset-0 z-10 grid grid-cols-[auto_1fr_auto] grid-rows-[auto_minmax(0,1fr)_auto] p-6"
	>
		<div
			class="pointer-events-none col-span-3 row-start-1 grid place-items-center opacity-50 select-none"
		>
			{#if showToolTip}
				<span
					transition:slide
					class="rounded bg-contrast/80 px-3 py-1 text-xs text-content backdrop-blur-sm"
				>
					{toolTipMessage}
				</span>
			{/if}
		</div>

		<div class="pointer-events-auto col-start-1 row-start-2 flex items-center">
			<Palette bind:selectedColor />
		</div>

		<div class="pointer-events-auto col-start-3 row-start-3 flex items-end gap-2">
			<Button label="+" onclick={toolTipWrapper(brushIncrease)} color="primary">+</Button>
			<Button label="-" onclick={toolTipWrapper(brushDecrease)} color="primary">-</Button>
			<Button label="save" onclick={toolTipWrapper(downloadCanvas)} color="primary">Save</Button>
			<Button label="reset" onclick={toolTipWrapper(resetCanvas)} color="accent">Reset</Button>
		</div>
	</div>
</main>

<style>
	/* Reset default body margins */
	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
	}
</style>
