import { STDIO } from './modules.ts';
import { VRChatOSCInterface } from './osc_interface.ts';
import { VRC_ADDRESS, VRC_RX_PORT, VRC_TX_PORT, INTERFACE_ADDRESS } from './constants.ts';

const Interface = new VRChatOSCInterface();

Interface.Create({
  VRC_ADDRESS,
  VRC_RX_PORT,
  VRC_TX_PORT,
  INTERFACE_ADDRESS
});

const stdio = STDIO();

stdio.on('line', async input => {
  const [address, ...values] = input.split(' ');
  await Interface.SendValueAcknowledged(address, ...values);
});

export { Interface, stdio };
