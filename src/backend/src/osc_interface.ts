import chalk from 'chalk';
import * as OSC from 'node-osc';
import { MD5 } from 'object-hash';
import { LazyMap } from './lazymap.ts';
import { LOGGING, VRC_AVI_DATA_DIR, VRC_AVI_STRUCTURE_DIR } from './constants.ts';
import { MessageListeners } from './message_listeners.ts';
import { AvatarDataLoader, AvatarStructureLoader, GenerateAvatarTypeMap, LoadLastAvatar, SaveLastAvatar, TryParse } from './modules.ts';
import type { $MessageListenerCallback, $VRChatOSCInterfaceArguments, $VRChatOSCInterfaceCurrentAvatar } from './types.ts';

export type $VRChatOSCInterfaceMessageCallback = $MessageListenerCallback<VRChatOSCInterface>;

export class VRChatOSCInterface extends MessageListeners { // TODO: genericize this
    private init = false;
    private last;
    private server!: OSC.Server; // INTF <- VRC
    private client!: OSC.Client; // INTF -> VRC
    private readonly unacknowledged_messages = new LazyMap<string, (value: boolean) => void>();

    avatar: $VRChatOSCInterfaceCurrentAvatar;

    constructor() {
        super();
        this.last = LoadLastAvatar();
        this.avatar = this.last ? {
            ...this.last, typemap: GenerateAvatarTypeMap(this.last.structure)
        } : {
            data: undefined, structure: undefined, typemap: GenerateAvatarTypeMap()
        };
        this.AddMessageListener('/avatar/change', (src, match, args) => {
            const avi_id: string = args[0];
            this.avatar.structure = AvatarStructureLoader(VRC_AVI_STRUCTURE_DIR, avi_id);
            this.avatar.data = AvatarDataLoader(VRC_AVI_DATA_DIR, avi_id);
            this.avatar.typemap = GenerateAvatarTypeMap(this.avatar.structure);
            SaveLastAvatar(this.avatar); // TODO: saved osc settings?
        });
    }

    Create(CONFIG: $VRChatOSCInterfaceArguments) {
        if (this.init) this.Destroy();

        this.client = new OSC.Client(CONFIG.CLIENT_ADDRESS, CONFIG.CLIENT_PORT);
        this.server = new OSC.Server(CONFIG.SERVER_PORT, CONFIG.SERVER_ADDRESS, () => {
            console.log(chalk.bgBlue(`[OSC_INTF] Server listening on ${CONFIG.SERVER_ADDRESS}:${CONFIG.SERVER_PORT}...`));
        });

        this.server.on('message', (...args) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [data, ...debug] = args;
            const [address, ...values] = data;
            LOGGING && console.log(chalk.bgBlack.green('⬇ [VRChat => OSC_INTF]'), chalk.yellow(address), values); // FLOATS MUST BE BETWEEN LIKE 0.01 AND SOMETHING ELSE TO AVOID OVERFLOWING XD
            this.HandleData(this, address, values);
            this.unacknowledged_messages.size > 0 && this.SetAcknowledged(MD5({ address, values }));
        });

        this.server.on('close', () => { this.init = false; console.log(chalk.bgYellow('[OSC_INTF] Server closed.')) });

        return this.server;
    }

    Destroy() {
        if (!this.init) return console.log(chalk.bgRed('[OSC_INTF] Server not initialized.'));
        this.server.close();
        this.client
        this.init = false;
    }

    GetUnacknowledged() {
        return this.unacknowledged_messages;
    }

    GetAvatar() {
        return this.avatar;
    }

    private SetAcknowledged(hash: string) {
        let resolve = this.unacknowledged_messages.get(hash);
        resolve?.(true) && this.unacknowledged_messages.delete(hash);
        return this.unacknowledged_messages;
    }

    private SetUnacknowledged(hash: string, resolve: (value: boolean) => void) {
        this.unacknowledged_messages.set(hash, resolve);
        return this.unacknowledged_messages;
    }

    private RemoveUnacknowledged(hash: string) {
        this.unacknowledged_messages.delete(hash);
        return this.unacknowledged_messages;
    }

    async SendValueAcknowledged(address: string, ...values: unknown[]): Promise<boolean> {
        const ack = await this.SendValue(address, ...values);
        let bgBlack = chalk.bgBlack;
        LOGGING && console.log(ack ? bgBlack.green('⬇ [VRChat => OSC_INTF] Message acknowledged.') : bgBlack.red('⬇ [VRChat => OSC_INTF] Message unacknowledged.'));
        return ack;
    }

    async SendValue(address: string, ...values: unknown[]): Promise<boolean> {
        values = TryParse(...values);

        if (values.length === 0) {
            console.log(chalk.bgRed(`[SendValue] Aborted sending <empty>.`));
            return false;
        }

        this.unacknowledged_messages.size >= 1024 && this.unacknowledged_messages.shift();

        await this.client.send(address, ...values);

        LOGGING && console.log(chalk.bgBlack.green('⬆ [OSC_INTF => VRChat]'), chalk.yellow(address), values);

        return new Promise(resolve => {
            let hash = MD5({ address, values });
            this.SetUnacknowledged(hash, resolve);
            setTimeout(() => {
                // this.RemoveUnacknowledged(hash);
                resolve(false);
            }, 1000 * 0.01); // ~64 requests/ms (6.6k/0.1s) can be made to a loopback in optimal conditions
        });
    }
}