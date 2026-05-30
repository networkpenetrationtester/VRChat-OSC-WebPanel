import { VRC_ADDRESS, VRC_RX_PORT, VRC_TX_PORT, INTERFACE_ADDRESS } from './constants.ts';
import { STDIO } from './modules.ts';
import { VRChatOSCRouter } from './osc_router.ts';
import type { $VRChatOSCRouterExternalApplication } from './types.ts';

const app: $VRChatOSCRouterExternalApplication = {
	address: '192.168.1.147',
	port: 9001,
	name: 'test'
};

const Router = new VRChatOSCRouter();

Router.Route('/*_', app);

Router.Create({
	VRC_ADDRESS,
	VRC_RX_PORT,
	VRC_TX_PORT,
	INTERFACE_ADDRESS
});

const stdio = STDIO();

stdio.on('line', async input => {
	const [address, ...values] = input.split(' ');
	await Router.SendValueAcknowledged(address, ...values);
});

export { Router };
