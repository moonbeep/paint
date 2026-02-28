<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.png';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Meru</title>
	<meta name="description" content="Creative canvas for blocky masterpieces." />
</svelte:head>
{@render children()}
