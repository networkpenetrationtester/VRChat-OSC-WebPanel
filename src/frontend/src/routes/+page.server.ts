import { AvatarStore } from "$lib";
import { get } from "svelte/store";

export function load() {
    return { avatar: get(AvatarStore) };
}