<script lang="ts">
    let { data } = $props();
    let avatar = $derived(data.avatar);
</script>

{#if avatar && avatar.structure}
    <div id="avatar_title" class="avatar.title">
        <p id="avatar_name">Name: {avatar.structure.name}</p>
        <p id="avatar_id">ID: {avatar.structure.id}</p>
        <p id="avatar_hash">Hash: {avatar.structure.hash}</p>
    </div>

    <hr />
    <br />

    <div id="avatar_parameters" class="avatar.parameters">
        {#each avatar.structure.parameters as parameter (parameter.name)}
            <div
                id="avatar_parameter_{btoa(parameter.name)}"
                class="avatar.parameter"
            >
                <h3>
                    {parameter.name} ({"R"}{parameter.writable ? "W" : "O"})
                </h3>
            </div>
            <br />
        {/each}
    </div>
{:else}
    <h1>AvatarStore missing or corrupted.</h1>
{/if}
