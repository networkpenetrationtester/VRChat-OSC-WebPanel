/* eslint-disable @typescript-eslint/no-unused-vars */
import { ReadLineOptions } from 'readline';
import { SERVER_ADDRESS, SERVER_PORT, CLIENT_ADDRESS, CLIENT_PORT, VRC_AVI_STRUCTURE_DIR, VRC_AVI_DATA_DIR, LOGGING } from './constants';
import { STDIO, AvatarStructureLoader, AvatarDataLoader, CreateIOTypeMaps, SaveLastAvatar } from './modules';
import { VRChatOSCInterface } from './osc_interface';
import type { $VRChatOSCInterfaceMessageCallback } from './osc_interface';

const INTERFACE = new VRChatOSCInterface();

INTERFACE.Create({
    SERVER_ADDRESS,
    SERVER_PORT,
    CLIENT_ADDRESS,
    CLIENT_PORT
});

const test: $VRChatOSCInterfaceMessageCallback = (src, map, ...values) => {
    const address = map.get('$address');
    const axis = map.get('axis');
    // console.log('[VRChat => OSC_INTF]', 'Velocity', axis, values);
}

INTERFACE.AddMessageListener('/avatar/parameters/Velocity:axis', test);

const stdio = STDIO({
    terminal: true
} as ReadLineOptions);

stdio.on('line', async (input) => {
    const [address, ...values] = input.split(' ');
    await INTERFACE.SendValueAcknowledged(address, ...values);
});

// const osc_avi_updater: $VRC_OSC_INTF_MSG_CB = (src, match, ...args) => {
//     const [avi_id] = args;
//     let structure = AvatarStructureLoader(VRC_AVI_STRUCTURE_DIR, avi_id);
//     let data = AvatarDataLoader(VRC_AVI_DATA_DIR, avi_id);

//     if (!(structure && data)) return;

//     src.CURRENT_AVI.STRUCTURE = structure;
//     src.CURRENT_AVI.TYPEMAPS = CreateIOTypeMaps(structure);
//     src.CURRENT_AVI.DATA = data;

//     SaveLastAvatar(src.CURRENT_AVI.DATA, src.CURRENT_AVI.STRUCTURE); // TODO: Retain actual user settings / keep track of all recieved osc values instead?
// };

// INTERFACE.AddMessageListener('/avatar/change', osc_avi_updater);