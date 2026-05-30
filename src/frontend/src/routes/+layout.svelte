<script lang="ts">
	import favicon from "$lib/assets/favicon_128x128.ico";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
