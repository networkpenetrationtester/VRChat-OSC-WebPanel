// import { VRC_ADDRESS, VRC_RX_PORT, VRC_TX_PORT, INTERFACE_ADDRESS } from './constants.ts';
// import { STDIO } from './modules.ts';
// import { VRChatOSCRouter } from './osc_router.ts';
// import type { $VRChatOSCRouterExternalApplication } from './types.ts';

// const app: $VRChatOSCRouterExternalApplication = {
// 	address: '192.168.1.147',
// 	port: 9001,
// 	name: 'test'
// };

// const Router = new VRChatOSCRouter();

// Router.Route('/*_', app);

// Router.Create({
// 	VRC_ADDRESS,
// 	VRC_RX_PORT,
// 	VRC_TX_PORT,
// 	INTERFACE_ADDRESS
// });

// const stdio = STDIO();

// stdio.on('line', async input => {
// 	const [address, ...values] = input.split(' ');
// 	await Router.SendValueAcknowledged(address, ...values);
// });

// export { Router };

// const fileWatcher = fs.watchFile('test.txt', (curr, prev) => { // it's kinda slow
// 	console.log(curr);
// 	fs.existsSync('test.txt') && console.log(fs.readFileSync('test.txt', 'utf8'));
// });

import fs from 'node:fs';
import path from 'node:path';
import { VRC_TEMP_DIR } from './constants.ts';
import type { $AmplitudeCache, $AmplitudeSettings } from './types_amplitude.ts';

export const AmplitudeStore

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
						console.log('CAHE:', amplitude_cache);
						return;
					}
					case 'amplitude.cache': {
						// if (stat.size <= 2) return;
						const amplitude_settings: $AmplitudeSettings = JSON.parse(data);
						console.log('SETTINGS:', amplitude_settings);
						return;
					}
					default: {

					}
				}
			} catch { }
		}
	}
});
