<script lang="ts">
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
		primary: 'bg-primary hover:bg-primary-light disabled:bg-primary-light',
		accent: 'bg-accent hover:bg-accent-light disabled:bg-accent-light',
		contrast: 'bg-contrast hover:bg-contrast-light disabled:bg-contrast-light'
	};
</script>

<button
	{onclick}
	aria-label={name}
	type="button"
	class="{htmlClass} flex justify-center {themes[color] ?? themes.primary} text-content"
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
