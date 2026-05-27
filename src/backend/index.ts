import { SERVER_ADDRESS, SERVER_PORT, CLIENT_ADDRESS, CLIENT_PORT, VRC_AVI_STRUCTURE_DIR, VRC_AVI_DATA_DIR, LOGGING } from './index.constants.ts';
import { STDIO, AvatarStructureLoader, AvatarDataLoader, CreateIOTypeMaps, SaveLastAvatar } from './index.modules.ts';
import { VRC_OSC_INTERFACE } from './index.osc_interface.ts';
import type { $MESSAGE_LISTENERS_CB } from './index.types.ts';

type $VRC_OSC_INTF_MSG_CB = $MESSAGE_LISTENERS_CB<VRC_OSC_INTERFACE>;

const INTERFACE = new VRC_OSC_INTERFACE();

INTERFACE.Create({
    SERVER_ADDRESS,
    SERVER_PORT,
    CLIENT_ADDRESS,
    CLIENT_PORT
});

// const test: $VRC_OSC_INTF_MSG_CB = (_, map, values) => {
//     const address = map.get('$address');
//     console.log('[VRChat => OSC_INTF]', address, values);
// }

// INTERFACE.AddMessageListener('/*_', test);

const stdio = STDIO();

stdio.on('line', async (input) => {
    const [address, ...values] = input.split(' ');
    let acknowledged = await INTERFACE.SendValue(address, ...values); // also hopefully helps prevent stupid feedback loops...
    console.log('ACK:', acknowledged);
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