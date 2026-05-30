// inspired by VOR
import { MD5 } from 'object-hash';
import { LazyMap } from './lazymap.ts';
import type { $MessageListenerCallback, $MessageListenerPMCObject, $VRChatOSCRouterExternalApplication, $VRChatOSCInterfaceConfiguration } from './types.ts';
import * as OSC from 'node-osc';
import { VRChatOSCInterface } from './osc_interface.ts';

export interface $OSCRouterForwarder {
  (address: string, ...data: any[]): any
}

export class VRChatOSCRouter extends VRChatOSCInterface {
  protected app_by_hash = new LazyMap<string, $VRChatOSCRouterExternalApplication>();
  protected callback_by_app_hash = new LazyMap<string, $MessageListenerCallback<VRChatOSCRouter>>();
  protected pmc_by_app_hash = new LazyMap<string, $MessageListenerPMCObject>();

  // TODO: internal router functions. They can be created and appended to a list to keep in memory for reference
  // TODO: generator for said router functions. Just an ordinary pmc :D (Route function creates + this.AddListener's)

  constructor(config: $VRChatOSCInterfaceConfiguration, ...external_applications: $VRChatOSCRouterExternalApplication[]) {
    super(config);
  }

  Route(pattern: string, app: $VRChatOSCRouterExternalApplication) {
    const app_hash = MD5(app);
    this.app_by_hash.trySetAndReturnValue(app_hash, app);
    const callback = this.callback_by_app_hash.trySetAndReturnValue(pattern, (src, map, address, ...values) => {
      const msg = new OSC.Message(address, ...values);
      const packet = OSC.encode(msg);
      this.client.send(packet, app.port, app.address);
    });
    this.AddMessageListener(pattern, callback);
  }

  UnRoute(pattern: string, app: $VRChatOSCRouterExternalApplication) {
    const app_hash = MD5(app);
    const callback = this.callback_by_app_hash.get(app_hash);
    if (!callback) return;
    this.RemoveMessageListener(pattern, callback);
  }
}
