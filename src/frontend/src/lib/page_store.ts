import { get, writable } from 'svelte/store';
export const PageStore = writable(new Array<HTMLElement>());
