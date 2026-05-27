import * as OSC from 'node-osc';
import { CreateIOTypeMaps, LoadLastAvatar, TryParse } from './index.modules.ts';
import type { $VRC_AVI_STRUCTURE_IO_DATATYPE, $VRC_OSC_INTF_ARGS } from './index.types.ts';
import { MessageListeners } from './index.message_listeners.ts';
import { MD5 } from 'object-hash';
import { LazyMap } from './index.lazymap.ts';
import { LOGGING } from './index.constants.ts';
import chalk from 'chalk';

export class VRC_OSC_INTERFACE extends MessageListeners { // TODO: genericize this
    private init = false;
    private last = LoadLastAvatar();
    private server!: OSC.Server; // INTF <- VRC
    private client!: OSC.Client; // INTF -> VRC
    private readonly UNACKS = new LazyMap<string, (value: boolean) => void>();

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
            console.log(chalk.bgBlue(`[OSC_INTF] Server listening on ${CONFIG.SERVER_ADDRESS}:${CONFIG.SERVER_PORT}...`));
        });

        this.server.on('message', (...args) => {
            const [data, ...debug] = args;
            const [address, ...values] = data;
            LOGGING && console.log(chalk.bgBlack.red('⬇ [VRChat => OSC_INTF]'), chalk.yellow(address), values); // FLOATS MUST BE BETWEEN LIKE 0.01 AND SOMETHING ELSE TO AVOID OVERFLOWING XD
            this.HandleData(this, address, values);
            this.UNACKS.size > 0 && this.SetAcknowledged(MD5({ address, values }));
        });

        this.server.on('close', () => { this.init = false; console.log(chalk.bgRed('[OSC_INTF] Server closed.')) });

        return this.server;
    }

    Destroy() {
        if (!this.init) return console.log(chalk.bgRed('[OSC_INTF] Server not initialized.'));
        this.server.close();
        this.client
        this.init = false;
    }

    GetUnacknowledged() {
        return this.UNACKS;
    }

    private SetAcknowledged(hash: string) {
        let resolve = this.UNACKS.get(hash);
        resolve?.(true) && this.UNACKS.delete(hash);
        return this.UNACKS;
    }

    private SetUnacknowledged(hash: string, resolve: (value: boolean) => void) {
        this.UNACKS.set(hash, resolve);
        return this.UNACKS;
    }

    private RemoveUnacknowledged(hash: string) {
        this.UNACKS.delete(hash);
        return this.UNACKS;
    }

    async SendValue(address: string, ...values: any[]): Promise<boolean> {
        values = TryParse(...values);

        if (values.length === 0) return false;

        this.UNACKS.size >= 1024 && this.UNACKS.shift();

        await this.client.send(address, ...values);

        LOGGING && console.log(chalk.bgBlack.green('⬆ [OSC_INTF => VRChat]'), chalk.yellow(address), values);

        return new Promise<boolean>(resolve => {
            let hash = MD5({ address, values });
            this.SetUnacknowledged(hash, resolve);
            setTimeout(() => { /* this.RemoveUnacknowledged(hash); */ resolve(false); }, 1000 * 0.01); // ~64 requests/ms (6.6k/0.1s) can be made to a loopback in optimal conditions
        });
    }
}