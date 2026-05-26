import * as OSC from 'node-osc';
import { CreateIOTypeMaps, LoadLastAvatar } from './index.modules.ts';
import type { $VRC_AVI_STRUCTURE_IO_DATATYPE, $VRC_OSC_INTF_ARGS } from './index.types.ts';
import { MessageListeners } from './index.message_listeners.ts';

export class VRC_OSC_INTERFACE extends MessageListeners {
    private init = false;
    private last = LoadLastAvatar();

    server!: OSC.Server; // INTF <- VRC
    client!: OSC.Client; // INTF -> VRC

    CURRENT_AVI = {
        STRUCTURE: this.last?.structure,
        DATA: this.last?.data,
        TYPEMAPS: {
            IN: new Map<string, $VRC_AVI_STRUCTURE_IO_DATATYPE>(),
            OUT: new Map<string, $VRC_AVI_STRUCTURE_IO_DATATYPE>()
        }
    }

    constructor() {
        super();
        if (this.CURRENT_AVI.STRUCTURE) this.CURRENT_AVI.TYPEMAPS = CreateIOTypeMaps(this.CURRENT_AVI.STRUCTURE);
    }

    Create(CONFIG: $VRC_OSC_INTF_ARGS) {
        if (this.init) this.Destroy();

        this.client = new OSC.Client(CONFIG.CLIENT_ADDRESS, CONFIG.CLIENT_PORT);

        this.server = new OSC.Server(CONFIG.SERVER_PORT, CONFIG.SERVER_ADDRESS, () => {
            console.log(`[OSC_INTF] Server listening on ${CONFIG.SERVER_ADDRESS}:${CONFIG.SERVER_PORT}...`);
        });

        this.server.on('message', (args) => {
            const [address, ...data] = args;
            this.ProcessAddress(this, address, data);
        });

        this.server.on('close', () => this.init = false);

        return this.server;
    }

    Destroy() {
        if (!this.init) return console.log(`[OSC_INTF] Interface not init....`);

        this.server.close();
        this.client
        this.init = false;
    }

    TrySendValue(address: string, value: any) {
        // if (!this.server_connected) return console.log(`[OSC_INTF] Server not connected....`);
        try {
            if (!value) return console.log(`[OSC_INTF => VRChat] Sender did nothing (input empty)`);

            value = value.toString();

            if (!this.CURRENT_AVI.TYPEMAPS.IN.has(address)) {
                console.log(`[OSC_INTF => VRChat] Sender trying to send ${value} => ${address} (typemap doesn't contain address)`);

                const try_int = parseInt(value);
                if (!isNaN(try_int) && try_int.toString() === value) return this.client.send(address, try_int);

                const try_float = parseFloat(value);
                if (!isNaN(try_float) && try_float.toString() === value) return this.client.send(address, try_float);

                const try_bool = ({ 'true': 1, 'false': 0 } as { [key: string]: number | undefined })[value];
                if (try_bool != undefined) return this.client.send(address, try_bool);

                console.log(`[OSC_INTF => VRChat] Sender still trying to send ${value} => ${address} (typemap doesn't contain address & failed to parse value)`);
                return this.client.send(address, value);
            }

            const datatype = this.CURRENT_AVI.TYPEMAPS.IN.get(address);

            switch (datatype) {
                case 'Bool': {
                    const try_bool = ({ 'true': 1, 'false': 0, '1': 1, '0': 1 } as { [key: string]: number | undefined })[value];

                    if (try_bool != undefined) return this.client.send(address, try_bool);

                    console.log(`[OSC_INTF => VRChat] Sender aborted send ${value} => ${address} (typemap contains address & value is not a Bool)`);
                    break;
                }

                case 'Int': {
                    const try_int = parseInt(value);

                    if (!isNaN(try_int) && try_int.toString() === value) {
                        this.client.send(address, try_int);
                        return true;
                    }

                    console.log(`[OSC_INTF => VRChat] Sender aborted send ${value} => ${address} (typemap contains address & value is not a Int)`);
                    break;
                }

                case 'Float': {
                    const try_float = parseFloat(value);

                    if (!isNaN(try_float) && try_float.toString() === value) {
                        this.client.send(address, try_float); // need some kinda nudge sometimes idk how vrchat floats fucking work sometimes they're discarded entirely, need min/max value range like 0.01274362543 for 0 and 0.9997888783 for 1
                        return true;
                    }

                    console.log(`[OSC_INTF => VRChat] Sender aborted send ${value} => ${address} (typemap contains address & value is not a Float)`);
                    break;
                }

                default: {
                    console.log(`[OSC_INTF => VRChat] Sender aborted send ${value} => ${address} (unknown datatype ${datatype})`);
                }
            }
        } catch (e) {
            console.error(e);
        }

        return false;
    }
}