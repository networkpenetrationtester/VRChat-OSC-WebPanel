// import { SERVER_ADDRESS, SERVER_PORT, CLIENT_ADDRESS, CLIENT_PORT, VRC_AVI_DATA_DIR, VRC_AVI_STRUCTURE_DIR } from './index.constants.ts';
// import { AvatarStructureLoader, AvatarDataLoader, CreateIOTypeMaps, SaveLastAvatar, STDIO } from './index.modules.ts';
// import { VRC_OSC_INTERFACE } from './index.osc_interface.ts';
// import type { $MESSAGE_LISTENERS_CB } from './index.types.ts';

import { SERVER_ADDRESS, SERVER_PORT, CLIENT_ADDRESS, CLIENT_PORT, VRC_AVI_STRUCTURE_DIR, VRC_AVI_DATA_DIR } from './index.constants.ts';
import { MessageListeners } from './index.message_listeners.ts';
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

const logger: $VRC_OSC_INTF_MSG_CB = (_, map, values) => {
    const address = map.get('$address');
    console.log('[VRChat => OSC_INTF]', address, values);
}

INTERFACE.AddMessageListener('/*_', logger);

const stdio = STDIO();

stdio.on('line', async (input) => {
    const [address, value] = input.split(' ');
    let acknowledged = await INTERFACE.SendValue(address, value); // also hopefully helps prevent stupid feedback loops...
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


// let p1 = '/test/:route';
// let p2 = '/api/:route/*args';
// let p3 = '/time/:zone';
// let p4 = '/avatar/parameters/Angular:axis';

// let cb1: $MESSAGE_LISTENERS_CB<any> = (src, map, ...values) => console.log(`[cb1] Route: ${map.get('route')} Values: ${values}`);
// let cb2: $MESSAGE_LISTENERS_CB<any> = (src, map, ...values) => console.log(`[cb2] Route: ${map.get('route')} Args: ${map.get('args')} Values: ${values}`);
// let cb3: $MESSAGE_LISTENERS_CB<any> = (src, map, ...values) => console.log(`[cb3] Zone: ${map.get('zone')} Values: ${values}`);
// let cb4: $MESSAGE_LISTENERS_CB<any> = (src, map, ...values) => console.log(`[cb4]: Angular Axis: ${map.get('axis')} Values: ${values}`);

// let listeners = new MessageListeners();

// listeners.AddMessageListener(p1, cb1);
// listeners.AddMessageListener(p1, cb1);
// console.log(listeners.pmc_by_hash.size === 1);

// listeners.RemoveMessageListener(p1, cb1);
// listeners.RemoveMessageListener(p4, cb1);
// console.log(listeners.pmc_by_hash.size === 0);

// listeners.AddMessageListener(p1, cb1);
// listeners.AddMessageListener(p2, cb2);
// listeners.AddMessageListener(p3, cb3);
// listeners.AddMessageListener(p4, cb4);
// listeners.RemoveMessageListener(p1, cb1);
// listeners.RemoveMessageListener(p2, cb2);
// listeners.RemoveMessageListener(p3, cb3);
// listeners.RemoveMessageListener(p4, cb4);
// console.log(listeners.pmc_by_hash.size === 0);

// listeners.AddMessageListener(p4, cb4);
// listeners.ProcessAddress({}, '/avatar/parameters/AngularX', 69);
// listeners.ProcessAddress({}, '/avatar/parameters/AngularY', 69);
// listeners.ProcessAddress({}, '/avatar/parameters/AngularZ', 69);
// console.log(listeners.pmc_cache_by_address.values().toArray().length === 3);
// listeners.RemoveMessageListener(p4, cb4);
// console.log(listeners.pmc_cache_by_address.values().every(value => value.length === 0));

// console.log(listeners);

// listeners.AddMessageListener(p1, cb1);
// listeners.AddMessageListener(p1, cb1);
// console.log(listeners.pmc_by_hash.size === 1);

// console.log(listeners);