import { VRChatOSCRouter } from "./osc_router";
import { VRC_ADDRESS, VRC_RX_PORT, VRC_TX_PORT, INTERFACE_ADDRESS } from "./constants";
import { $VRChatOSCRouterExternalApplication } from "./types";

const config = {
    VRC_ADDRESS,
    VRC_RX_PORT,
    VRC_TX_PORT,
    INTERFACE_ADDRESS
}

const app: $VRChatOSCRouterExternalApplication = {
    address: '192.168.1.147',
    port: 9999,
    name: 'test'
};

const router = new VRChatOSCRouter(config, app);

router.Create();