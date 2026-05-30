/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from 'chalk';
import * as OSC from 'node-osc';
import dgram from 'dgram';
import { MD5 } from 'object-hash';
import { LazyMap } from './lazymap.ts';
import { INTERFACE_ADDRESS, LOGGING, VERBOSE, VRC_AVI_DATA_DIR, VRC_AVI_STRUCTURE_DIR } from './constants.ts';
import {
	AvatarDataLoader,
	AvatarStructureLoader,
	GenerateAvatarTypeMap,
	LoadLastAvatar,
	SaveLastAvatar,
	TryParse
} from './modules.ts';
import type {
	$MessageListenerCallback,
	$VRChatOSCInterfaceConfiguration,
	$VRChatOSCInterfaceCurrentAvatar
} from './types.ts';
import { MessageListener } from './message_listener.ts';

export type $VRChatOSCInterfaceMessageCallback = $MessageListenerCallback<VRChatOSCInterface>;

export class VRChatOSCInterface extends MessageListener {
	protected init = false;
	protected unacknowledged = new LazyMap<string, (value: boolean) => void>();
	protected server!: OSC.Server;
	protected client!: dgram.Socket;
	protected config!: $VRChatOSCInterfaceConfiguration;

	readonly avatar: $VRChatOSCInterfaceCurrentAvatar;

	constructor(config: $VRChatOSCInterfaceConfiguration) {
		super();
		this.config = config;
		const last_avatar = LoadLastAvatar();
		this.avatar = last_avatar
			? { ...last_avatar, typemap: GenerateAvatarTypeMap(last_avatar.structure) }
			: { data: undefined, structure: undefined, typemap: GenerateAvatarTypeMap() };

		this.AddMessageListener('/avatar/change', (src, match, args) => {
			const [avi_id] = JSON.stringify(args[0]);
			this.avatar.structure = AvatarStructureLoader(VRC_AVI_STRUCTURE_DIR, avi_id);
			this.avatar.data = AvatarDataLoader(VRC_AVI_DATA_DIR, avi_id);
			this.avatar.typemap = GenerateAvatarTypeMap(this.avatar.structure);
			SaveLastAvatar(this.avatar);
		});
	}

	Create(config?: $VRChatOSCInterfaceConfiguration) {
		if (this.init) this.Destroy();

		if (config) this.config = config;

		this.server = new OSC.Server(this.config.VRC_TX_PORT, this.config.INTERFACE_ADDRESS, () => {
			console.log(chalk.bgBlue(`[OSC_INTF] Server listening on ${INTERFACE_ADDRESS}:${this.config.VRC_TX_PORT}...`));
		});

		this.server.on('message', (...args) => {
			const [data, ...debug] = args;
			const [address, ...values] = data;
			VERBOSE && console.log(chalk.bgBlack.green('⬇ [VRChat => OSC_INTF]'), debug);
			LOGGING && console.log(chalk.bgBlack.green('⬇ [VRChat => OSC_INTF]'), chalk.yellow(address), values);
			this.HandleData(this, address, values);
			this.unacknowledged.size > 0 && this.SetAcknowledged(MD5({ address, values }));
		});

		this.server.on('close', () => {
			this.init = false;
			console.log(chalk.bgYellow('[OSC_INTF] Server closed.'));
		});

		this.client = dgram.createSocket('udp4', () => {
			this.client.bind(this.config.VRC_TX_PORT, INTERFACE_ADDRESS);
			chalk.bgBlue(`[OSC_INTF] Client sending on ${INTERFACE_ADDRESS}:${this.config.VRC_TX_PORT}...`)
		});

		this.client.on('message', (msg) => {
			console.log('CLIENT SAW', msg);
		});

		this.client.on('close', () => {
			this.init = false;
			console.log(chalk.bgYellow('[OSC_INTF] Client closed.'));
		});

		return this;
	}

	Destroy() {
		if (!this.init) return console.log(chalk.bgRed('[OSC_INTF] Interface not initialized.'));
		this.server.close();
		this.client.close();
		this.init = false;
		return this;
	}

	GetUnacknowledged() {
		return this.unacknowledged;
	}

	GetAvatar() {
		return this.avatar;
	}

	private SetAcknowledged(hash: string) {
		const resolve = this.unacknowledged.get(hash);
		resolve?.(true) && this.unacknowledged.delete(hash);
		return this.unacknowledged;
	}

	private SetUnacknowledged(hash: string, resolve: (value: boolean) => void) {
		this.unacknowledged.set(hash, resolve);
		return this.unacknowledged;
	}

	private RemoveUnacknowledged(hash: string) {
		this.unacknowledged.delete(hash);
		return this.unacknowledged;
	}

	async SendValueAcknowledged(address: string, ...values: any[]): Promise<boolean> {
		const ack = await this.SendValue(address, ...values);
		const bgBlack = chalk.bgBlack;
		LOGGING &&
			console.log(
				ack
					? bgBlack.green('⬇ [VRChat => OSC_INTF] Message acknowledged.')
					: bgBlack.red('⬇ [VRChat => OSC_INTF] Message unacknowledged.')
			);
		return ack;
	}

	async SendValue(address: string, ...values: any[]): Promise<boolean> {
		values = TryParse(...values);

		if (values.length === 0) {
			console.log(chalk.bgRed(`[SendValue] Aborted sending <empty>.`));
			return false;
		}

		this.unacknowledged.size >= 1024 && this.unacknowledged.shift();

		const msg = new OSC.Message(address, ...values);
		const packet = OSC.encode(msg);

		this.client.send(packet, this.config.VRC_RX_PORT, this.config.VRC_ADDRESS);

		LOGGING && console.log(chalk.bgBlack.green('⬆ [OSC_INTF => VRChat]'), chalk.yellow(address), values);

		return new Promise(resolve => {
			const hash = MD5({ address, values });
			this.SetUnacknowledged(hash, resolve);
			setTimeout(() => {
				// this.RemoveUnacknowledged(hash);
				resolve(false);
			}, 1000 * 0.01);
			// ~64 requests/ms (6.4k/s) can be made to a loopback in optimal conditions
			// 10 ms given: ~640 messages can be recieved in this duration
		});
	}
}
