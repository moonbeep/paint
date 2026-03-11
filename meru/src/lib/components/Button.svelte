<script lang="ts">
	import type { Snippet } from 'svelte';

	const {
		label = 'button',
		onclick = undefined,
		disabled = false,
		color = 'primary',
		children
	} = $props<{
		label?: string;
		onclick?: () => void;
		disabled?: boolean;
		color?: 'primary' | 'accent' | 'contrast';
		children: Snippet;
	}>();

	const themes: Record<string, string> = {
		primary: 'bg-primary hover:bg-primary-light disabled:bg-primary-dark',
		accent: 'bg-accent hover:bg-accent-light disabled:bg-accent-dark',
		contrast: 'bg-contrast hover:bg-contrast-light disabled:bg-contrast-dark'
	};
</script>

<button
	aria-label={label}
	{onclick}
	{disabled}
	class="rounded-md px-4 py-2 text-sm font-semibold tracking-wider whitespace-nowrap text-content uppercase shadow-md active:scale-95 disabled:text-subtext {themes[
		color
	] ?? themes.primary}"
>
	{@render children()}
</button>
