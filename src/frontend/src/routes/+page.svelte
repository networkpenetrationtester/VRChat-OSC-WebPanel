<script lang="ts">
    import { AvatarGenerator } from "$lib/avatar.remote";
    import Parameter from "$lib/parameter.svelte";
    const Generator = AvatarGenerator();
</script>

<svelte:head>
    <script>
        window.elements = [];
    </script>
</svelte:head>

{#await Generator then avatar}
    {#if avatar && avatar.structure}
        <div id="avatar_card" class="avatar.card">
            <h1 class="center">Current Avatar</h1>
            <h2 id="avatar_name">Name: {avatar.structure.name}</h2>
            <h2 id="avatar_id">ID: {avatar.structure.id}</h2>
            <h2 id="avatar_hash">Hash: {avatar.structure.hash}</h2>
        </div>
        <hr />
        <h1 class="center">Parameters</h1>
        <div id="avatar_parameters" class="avatar.parameters">
            {#each avatar.structure.parameters as parameter}
                <Parameter {...parameter} />
            {/each}
        </div>
    {/if}
{:catch}
    <h1>Avatar missing or corrupted.</h1>
{/await}

<style>
    .center {
        text-align: center;
    }
</style>
