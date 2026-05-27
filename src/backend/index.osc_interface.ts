import * as OSC from 'node-osc';
import { CreateIOTypeMaps, LoadLastAvatar } from './index.modules.ts';
import type { $VRC_AVI_STRUCTURE_IO_DATATYPE, $VRC_OSC_INTF_ARGS } from './index.types.ts';
import { MessageListeners } from './index.message_listeners.ts';
import { MD5 } from 'object-hash';
import { LazyMap } from './index.lazymap.ts';

export class VRC_OSC_INTERFACE extends MessageListeners {
    /* private */ init = false;
    /* private */ last = LoadLastAvatar();
    /* private */ server!: OSC.Server; // INTF <- VRC
    /* private */ client!: OSC.Client; // INTF -> VRC

    UNACKNOWLEDGED = new LazyMap<string, (value: boolean) => void>();

    CURRENT_AVI = {
        STRUCTURE: this.last?.structure,
        DATA: this.last?.data,
        TYPEMAPS: {
            IN: new LazyMap<string, $VRC_AVI_STRUCTURE_IO_DATATYPE>(),
            OUT: new LazyMap<string, $VRC_AVI_STRUCTURE_IO_DATATYPE>()
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

        this.server.on('message', (...args) => {
            const [data, ...debug] = args;
            const [address, ...values] = data;
            this.HandleData(this, address, values);
            this.UNACKNOWLEDGED.size > 0 && this.SetAcknowledged(address, values);
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

    SetAcknowledged(address: string, values: any[]) {
        let obj = { address, value: values };
        let obj_hash = MD5(obj);
        let resolve = this.UNACKNOWLEDGED.get(obj_hash);
        resolve?.(true) && this.UNACKNOWLEDGED.delete(obj_hash);
    }

    SetUnacknowledged(address: string, values: any[], resolve: (value: boolean) => void) {
        let obj = { address, value: values };
        let obj_hash = MD5(obj);
        this.UNACKNOWLEDGED.set(obj_hash, resolve);
        return this.UNACKNOWLEDGED;
    }

    TryParse(...values: any[]) { // TODO: typegaurd?
        return values.map(value => {
            try {
                value = value.toString();

                const try_int = parseInt(value);
                if (!isNaN(try_int) && try_int.toString() === value) return try_int;

                const try_float = parseFloat(value);
                if (!isNaN(try_float)) return Math.fround(try_float);

                const try_bool = ({ 'true': 1, 'false': 0 } as { [key: string]: number | undefined })[value];
                return try_bool ?? false;
            } catch (e) {
                return;
            }
        }).filter(value => value !== null && value !== undefined);
    }

    async SendValue(address: string, ...values: any[]): Promise<boolean> {
        values = this.TryParse(...values);
        if (!values) return false;

        console.log(`[OSC_INTF => VRChat]`, address, values);

        if (this.UNACKNOWLEDGED.size > 256) console.log(`Buffer size exceeded 256, dropping last value: ${JSON.stringify(this.UNACKNOWLEDGED.pop())}`);

        await this.client.send(address, ...values);

        return new Promise<boolean>(resolve => {
            this.SetUnacknowledged(address, values, resolve);
            setTimeout(() => resolve(false), 1000); // 100 ms for you MAX.
        });
    }
}

//     switch (datatype) {
//         case 'Bool': {
//             const try_bool = ({ 'true': 1, 'false': 0, '1': 1, '0': 1 } as { [key: string]: number | undefined })[values];

//             if (try_bool != undefined) return this.client.send(address, try_bool);

//             console.log(`[OSC_INTF => VRChat] Sender aborted send ${values} => ${address} (typemap contains address & value is not a Bool)`);
//             break;
//         }

//         case 'Int': {
//             const try_int = parseInt(values);

//             if (!isNaN(try_int) && try_int.toString() === values) {
//                 this.client.send(address, try_int);
//                 return true;
//             }

//             console.log(`[OSC_INTF => VRChat] Sender aborted send ${values} => ${address} (typemap contains address & value is not a Int)`);
//             break;
//         }

//         case 'Float': {
//             const try_float = parseFloat(values);

//             if (!isNaN(try_float) && try_float.toString() === values) {
//                 this.client.send(address, try_float); // need some kinda nudge sometimes idk how vrchat floats fucking work sometimes they're discarded entirely, need min/max value range like 0.01274362543 for 0 and 0.9997888783 for 1
//                 return true;
//             }

//             console.log(`[OSC_INTF => VRChat] Sender aborted send ${values} => ${address} (typemap contains address & value is not a Float)`);
//             break;
//         }

//         default: {
//             console.log(`[OSC_INTF => VRChat] Sender aborted send ${values} => ${address} (unknown datatype ${datatype})`);
//         }
//     }
// } catch(e) {
//     console.error(e);
// }