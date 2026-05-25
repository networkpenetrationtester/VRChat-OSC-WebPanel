import { SERVER_ADDRESS, SERVER_PORT, CLIENT_ADDRESS, CLIENT_PORT, VRC_AVI_DATA_DIR, VRC_AVI_STRUCTURE_DIR } from './index.constants.ts';
import { AvatarStructureLoader, AvatarDataLoader, CreateIOTypeMaps, SaveLastAvatar, STDIO } from './index.modules.ts';
import { type $VRC_OSC_INTF_MSG_CB, VRC_OSC_INTERFACE } from './index.osc_interface.ts';

const osc_intf = new VRC_OSC_INTERFACE();

osc_intf.Create({
    SERVER_ADDRESS,
    SERVER_PORT,
    CLIENT_ADDRESS,
    CLIENT_PORT
});

const all_logger: $VRC_OSC_INTF_MSG_CB = (src, map, ...values) => {
    const path = map.get('path');
    console.log(`[VRChat => OSC_INTF] ${path} =>`, ...values);
}

const axis_logger: $VRC_OSC_INTF_MSG_CB = (src, map, ...values) => {
    const path = map.get('path');
    const axis = map.get('axis');
    console.log(path, axis, ...values);
};

// osc_intf.AddMessageListener('/avatar/parameters/Angular:axis', axis_logger);
// osc_intf.AddMessageListener('/avatar/parameters/Velocity:axis', axis_logger);
osc_intf.AddMessageListener('/*all', all_logger);

const stdio = STDIO();

stdio.on('line', (input => {
    const [address, value] = input.split(' ');
    osc_intf.TrySendValue(address, value);
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