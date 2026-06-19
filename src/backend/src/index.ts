import fs from 'node:fs';
import path from 'node:path';
import { INTERFACE_ADDRESS, VRC_ADDRESS, VRC_RX_PORT, VRC_TEMP_DIR, VRC_TX_PORT } from './constants.ts';
import type { $AmplitudeCache, $AmplitudeSettings } from './types_amplitude.ts';
import { VRChatOSCRouter } from './osc_router.ts';
import { STDIO } from './modules.ts';
import type { $MessageListenerCallback } from './types.ts';
import { VRChatOSCInterface } from './osc_interface.ts';

export const AmplitudeCache: $AmplitudeCache = [];

const AmplitudeWatcher = fs.watch(VRC_TEMP_DIR, (event, filename) => {
	console.log(event, filename);
	if (event === 'change') {
		if (filename) {
			const filepath = path.join(VRC_TEMP_DIR, filename);
			const data = fs.readFileSync(filepath, 'utf-8');
			const stat = fs.statSync(filepath);
			try {
				switch (filename) {
					case 'amplitude.cache': {
						if (stat.size <= 2) return;
						const amplitude_cache: $AmplitudeCache = JSON.parse(data);
						// console.log('CAHE:', amplitude_cache);
						// console.log(amplitude_cache.pop()?.user_properties.currentAvatarId);
						console.log('CACHE UPDATE');
						return;
					}
					case 'com_settings.amplitude': {
						// if (stat.size <= 2) return;
						const amplitude_settings: $AmplitudeSettings = JSON.parse(data);
						// console.log('SETTINGS:', amplitude_settings);
						console.log('SETTINGS UPDATE');
						return;
					}
					default: {
					}
				}
			} catch {}
		}
	}
});

const int = new VRChatOSCInterface({
	VRC_ADDRESS,
	VRC_RX_PORT,
	VRC_TX_PORT,
	INTERFACE_ADDRESS
});

int.Create();

STDIO().on('line', async line => {
	const [address, ...values] = line.split(' ');
	await int.SendValueAcknowledged(address, ...values);
});
