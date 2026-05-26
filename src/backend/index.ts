import { SERVER_ADDRESS, SERVER_PORT, CLIENT_ADDRESS, CLIENT_PORT, VRC_AVI_DATA_DIR, VRC_AVI_STRUCTURE_DIR } from './index.constants.ts';
import { AvatarStructureLoader, AvatarDataLoader, CreateIOTypeMaps, SaveLastAvatar, STDIO } from './index.modules.ts';
import { VRC_OSC_INTERFACE } from './index.osc_interface.ts';
import type { $VRC_LISTENERS_MSG_CB } from './index.types.ts';

type $VRC_OSC_INTF_MSG_CB = $VRC_LISTENERS_MSG_CB<VRC_OSC_INTERFACE>;

const INTERFACE = new VRC_OSC_INTERFACE();

INTERFACE.Create({
    SERVER_ADDRESS,
    SERVER_PORT,
    CLIENT_ADDRESS,
    CLIENT_PORT
});

// const all_logger: $VRC_OSC_INTF_MSG_CB = (_, map, ...values) => {
//     const path = map.get('path');
//     console.log(`[VRChat => OSC_INTF] ${path} =>`, ...values);
// }

// INTERFACE.AddMessageListener('/*all', all_logger);

const velocity_logger: $VRC_OSC_INTF_MSG_CB = (_, map, ...values) => {
    const axis = map.get('axis');
    console.log(`Moved ${values[0]} m/s on axis ${axis}`);
}

INTERFACE.AddMessageListener('/avatar/parameters/Velocity:axis', velocity_logger);

setTimeout(() => {
    INTERFACE.RemoveMessageListener('/avatar/parameters/Velocity:axis', velocity_logger)
    console.log('REMOVE TEST');
}, 5000);

const stdio = STDIO();

stdio.on('line', (input => {
    const [address, value] = input.split(' ');
    INTERFACE.TrySendValue(address, value);
}));

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

// osc_intf.AddMessageListener('/avatar/change', osc_avi_updater);