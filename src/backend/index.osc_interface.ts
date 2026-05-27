import * as OSC from 'node-osc';
import { CreateIOTypeMaps, LoadLastAvatar, TryParse } from './index.modules.ts';
import type { $VRC_AVI_STRUCTURE_IO_DATATYPE, $VRC_OSC_INTF_ARGS } from './index.types.ts';
import { MessageListeners } from './index.message_listeners.ts';
import { MD5 } from 'object-hash';
import { LazyMap } from './index.lazymap.ts';

export class VRC_OSC_INTERFACE extends MessageListeners {
    private init = false;
    private last = LoadLastAvatar();
    private server!: OSC.Server; // INTF <- VRC
    private client!: OSC.Client; // INTF -> VRC
    private UN_ACK = new LazyMap<string, (value: boolean) => void>();

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
            this.UN_ACK.size > 0 && this.SetAcknowledged(MD5({ address, values }));
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

    SetAcknowledged(hash: string) {
        let resolve = this.UN_ACK.get(hash);
        resolve?.(true) && this.UN_ACK.delete(hash);
        return this.UN_ACK;
    }

    GetUnacknowledged() {
        return this.UN_ACK;
    }

    SetUnacknowledged(hash: string, resolve: (value: boolean) => void) {
        this.UN_ACK.set(hash, resolve);
        return this.UN_ACK;
    }

    RemoveUnacknowledged(hash: string) {
        this.UN_ACK.delete(hash);
        return this.UN_ACK;
    }

    async SendValue(address: string, ...values: any[]): Promise<boolean> {
        values = TryParse(...values);
        if (!values) return false;

        // console.log(`[OSC_INTF => VRChat]`, address, values);

        if (this.UN_ACK.size >= 1024) {
            // console.log('STACK SIZE EXCEEDING 1024');
            //let [hash, resolve] = 
            this.UN_ACK.shift();
            // if (MD5({ address: 'test', values: [1, 2, 3] }) === hash) {
            //     console.log('WORKED');
            // };
        }

        await this.client.send(address, ...values);

        return new Promise<boolean>(resolve => {
            let hash = MD5({ address, values });
            this.SetUnacknowledged(hash, resolve);
            setTimeout(() => { /* this.RemoveUnacknowledged(hash); */ resolve(false); }, 100); // 100 ms for you MAX.
        });
    }
}