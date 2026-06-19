/* eslint-disable @typescript-eslint/no-explicit-any */
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
	LogDownlink,
	LogError,
	LogInfo,
	LogUplink,
	LogWarn,
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
	protected _avatar: $VRChatOSCInterfaceCurrentAvatar;

	get avatar() {
		return this._avatar;
	}

	constructor(config?: $VRChatOSCInterfaceConfiguration) {
		super();

		if (config) this.config = config;

		const last_avatar = LoadLastAvatar();

		this._avatar = last_avatar
			? { ...last_avatar, typemap: GenerateAvatarTypeMap(last_avatar.structure) }
			: { data: undefined, structure: undefined, typemap: GenerateAvatarTypeMap() };

		this.AddMessageListener('/avatar/change', (src, map, address, ...values) => {
			const [avi_id] = values;

			this._avatar.structure = AvatarStructureLoader(VRC_AVI_STRUCTURE_DIR, avi_id);
			this._avatar.data = AvatarDataLoader(VRC_AVI_DATA_DIR, avi_id);
			this._avatar.typemap = GenerateAvatarTypeMap(this._avatar.structure);

			SaveLastAvatar(this._avatar);

			return;
		});
	}

	Create(config?: $VRChatOSCInterfaceConfiguration) {
		if (config) this.config = config;
		if (!this.config) return LogWarn(`[OSC_INTF] Interface configuration empty.`);
		if (this.init) this.Destroy();

		this.client = dgram.createSocket('udp4').bind(this.config.VRC_RX_PORT, this.config.INTERFACE_ADDRESS, () => {
			LogInfo(`[OSC_INTF] Client sending to ${INTERFACE_ADDRESS}:${this.config.VRC_RX_PORT}...`);
		});

		this.client.on('close', () => {
			this.Destroy();
			LogWarn('[OSC_INTF] Client closed.');
		});

		this.server = new OSC.Server(this.config.VRC_TX_PORT, this.config.INTERFACE_ADDRESS, () => {
			LogInfo(`[OSC_INTF] Server listening on ${INTERFACE_ADDRESS}:${this.config.VRC_TX_PORT}...`);
		});

		this.server.on('message', (...args) => {
			const [data, ...debug] = args;
			const [address, ...values] = data;

			if (VERBOSE) LogDownlink('VRChat => OSC_INTF', 'Debug', ...debug);
			if (LOGGING) LogDownlink('VRChat => OSC_INTF', address, ...values);

			this.HandleData(this, address, ...values);

			if (this.unacknowledged.size > 0) {
				const hash = MD5({ address, values });
				this.SetAcknowledged(hash);
			}
		});

		this.server.on('close', () => {
			this.Destroy();
			LogWarn('[OSC_INTF] Server closed.');
		});

		this.init = false;

		return this;
	}

	Destroy() {
		if (!this.init) LogWarn('[OSC_INTF] Interface not initialized.');

		this.server.close();
		this.client.close();

		this.init = false;

		return this;
	}

	GetUnacknowledged() {
		return this.unacknowledged;
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

		if (ack) LogDownlink('VRChat => OSC_INTF', 'ACKNOWLEDGED');
		else LogDownlink('VRChat => OSC_INTF', 'UNACKNOWLEDGED');

		return ack;
	}

	async SendValue(address: string, ...values: any[]): Promise<boolean> {
		values = TryParse(...values);

		if (values.length === 0) return false && LogError(`[SendValue] Aborted sending <empty>.`);
		if (this.unacknowledged.size >= 1024) this.unacknowledged.shift();

		const msg = new OSC.Message(address, ...values);
		const packet = OSC.encode(msg);

		this.client.send(packet, this.config.VRC_RX_PORT, this.config.VRC_ADDRESS);

		if (LOGGING) LogUplink('OSC_INTF => VRChat', address, ...values);

		return new Promise(resolve => {
			const hash = MD5({ address, values });
			this.SetUnacknowledged(hash, resolve);
			setTimeout(() => {
				// this.RemoveUnacknowledged(hash);
				resolve(false);
			}, 10);
			// ~64 requests/ms (6.4k/s) can be made to a loopback in optimal conditions
			// 10 ms given: ~640 messages can be recieved in this duration
		});
	}
}
