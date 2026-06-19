// inspired by VOR
import { MD5 } from 'object-hash';
import { LazyMap } from './lazymap.ts';
import chalk from 'chalk';
import type { $VRChatOSCRouterExternalApplication, $VRChatOSCInterfaceConfiguration } from './types.ts';
import * as OSC from 'node-osc';
import { VRChatOSCInterface } from './osc_interface.ts';
import { LOGGING } from './constants.ts';
import type { $VRChatOSCInterfaceMessageCallback } from './osc_interface.ts';
import { LogUplink } from './modules.ts';

export class VRChatOSCRouter extends VRChatOSCInterface {
	protected forwarder_by_app_hash = new LazyMap<string, $VRChatOSCInterfaceMessageCallback>();

	constructor(config?: $VRChatOSCInterfaceConfiguration) {
		super(config);
	}

	Route(pattern: string, app: $VRChatOSCRouterExternalApplication) {
		const app_hash = MD5(app);
		let forwarder = this.forwarder_by_app_hash.get(app_hash);

		if (!forwarder) {
			forwarder = this.forwarder_by_app_hash.setAndReturnValue(app_hash, (src, map, address, ...values) => {
				const msg = new OSC.Message(address, ...values);
				const packet = OSC.encode(msg);

				this.client.send(packet, app.port, app.address, err => {
					if (err) {
						LogUplink(
							`OSC_RTR => ${app.address}:${app.port}${app.name ? [' (', ')'].join(app.name) : ''}`,
							'Failed to forward values.',
							err
						);
					} else if (LOGGING) {
						LogUplink(
							`OSC_RTR => ${app.address}:${app.port}${app.name ? [' (', ')'].join(app.name) : ''}`,
							address,
							...values
						);
					}
				});
			});
		}

		this.AddMessageListener(pattern, forwarder);
	}

	UnRoute(pattern: string, app: $VRChatOSCRouterExternalApplication) {
		const app_hash = MD5(app);
		const forwarder = this.forwarder_by_app_hash.get(app_hash);
		if (!forwarder) return;
		this.RemoveMessageListener(pattern, forwarder);
	}
}
