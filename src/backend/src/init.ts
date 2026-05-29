import { STDIO } from './modules.ts';
import { VRChatOSCInterface } from './osc_interface.ts';
import { SERVER_ADDRESS, SERVER_PORT, CLIENT_ADDRESS, CLIENT_PORT } from './constants.ts';

const Interface = new VRChatOSCInterface();

Interface.Create({
    SERVER_ADDRESS,
    SERVER_PORT,
    CLIENT_ADDRESS,
    CLIENT_PORT
});

const stdio = STDIO();

stdio.on('line', async (input) => {
    const [address, ...values] = input.split(' ');
    await Interface.SendValueAcknowledged(address, ...values);
});

export { Interface, stdio };