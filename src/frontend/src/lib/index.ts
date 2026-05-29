// place files you want to import through the `$lib` alias in this folder.
import { get, readable, writable } from 'svelte/store';
import { Interface } from 'backend/dist/init';
import type { VRChatOSCInterface } from 'backend/dist/osc_interface';
import type { $VRChatOSCInterfaceCurrentAvatar } from 'backend/dist/types';

const AvatarStore = readable(Interface.avatar);
export { AvatarStore };
