<script lang="ts">
    // import { PageStore } from "$lib/page_store";
    import type { $VRChatAvatarStructureParameter } from "$lib/patch_cable";
    const parameter: $VRChatAvatarStructureParameter = $props();
    // svelte-ignore state_referenced_locally
    const b64_id = "param_" + btoa(parameter.name);
</script>

<div class="avatar.parameter" id={b64_id}>
    <h3>
        {parameter.name} ({"R"}{parameter.writable ? "W" : "O"})
    </h3>
    {#if parameter.writable && parameter.input}
        <label
            >Write<input
                id="{b64_id}.input"
                type="range"
                oninput={(e)=>{
                    console.log(e);
                }}
            /></label
        >
        <br />
    {/if}
    <label>Read<input id="{b64_id}.output" /> </label>
    <br />
</div>
