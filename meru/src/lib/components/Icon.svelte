<script lang="ts">
	// TASK: Fix hover
	import { DEFAULT_ICON } from '$lib/constants';
	import { icons } from '$lib/utils/icons';
	const {
		name = DEFAULT_ICON,
		size = 6,
		onclick = undefined,
		htmlClass = '',
		color = 'primary',
		disabled = false
	} = $props<{
		name: string;
		size?: number;
		onclick?: () => void;
		htmlClass?: string;
		color?: 'primary' | 'accent' | 'contrast';
		disabled?: boolean;
	}>();

	const themes: Record<string, string> = {
		primary: 'text-primary hover:text-primary-light disabled:text-primary-light',
		accent: 'text-accent hover:text-accent-light disabled:text-accent-light',
		contrast: 'text-contrast hover:text-contrast-light disabled:text-contrast-light'
	};
</script>

<button
	{onclick}
	aria-label={name}
	type="button"
	class="{htmlClass} flex justify-center {themes[color] ?? themes.primary}"
	{disabled}
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="currentColor"
		class="size-{size}"
	>
		{#each icons[name] || icons[DEFAULT_ICON] as path (path)}
			<path fill-rule="evenodd" d={path} clip-rule="evenodd" />
		{/each}
	</svg>
</button>
