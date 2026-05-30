// inspired by VOR
import { MD5 } from 'object-hash';
import { LazyMap } from './lazymap.ts';
import chalk from 'chalk';
import type { $VRChatOSCRouterExternalApplication, $VRChatOSCInterfaceConfiguration } from './types.ts';
import * as OSC from 'node-osc';
import { $VRChatOSCInterfaceMessageCallback, VRChatOSCInterface } from './osc_interface.ts';
import { LOGGING, VERBOSE } from './constants.ts';

export class VRChatOSCRouter extends VRChatOSCInterface {
  protected forwarder_by_app_hash = new LazyMap<string, $VRChatOSCInterfaceMessageCallback>();

  constructor(config?: $VRChatOSCInterfaceConfiguration) {
    super(config);
  }

  Route(pattern: string, app: $VRChatOSCRouterExternalApplication) {
    const app_hash = MD5(app);
    let forwarder = this.forwarder_by_app_hash.get(app_hash);

    if (!forwarder) { // TODO: STANDARDIZE THIS LOGGING.
      forwarder = this.forwarder_by_app_hash.setAndReturnValue(app_hash, (src, map, address, ...values) => {
        const msg = new OSC.Message(address, ...values);
        const packet = OSC.encode(msg);
        this.client.send(packet, app.port, app.address, (err) => {
          if (err) {
            console.log(chalk.bgBlack.red(`⬆ [OSC_RTR => ${app.name ?? [app.address, app.port].join(':')}]`), chalk.yellow(address), values);
          } else if (LOGGING) {
            console.log(chalk.bgBlack.blue(`⬆ [OSC_RTR => ${app.address}:${app.port}${app.name ? [' (', ')'].join(app.name) : ''}`), chalk.yellow(address), values);
          }
        });
      });
    }

    this.AddMessageListener(pattern, forwarder);
  }

  UnRoute(pattern: string, app: $VRChatOSCRouterExternalApplication) {
    // const app_hash = MD5(app);
    // const callback = this.callback_by_app_hash.get(app_hash);
    // if (!callback) return;
    // this.RemoveMessageListener(pattern, callback);
  }
}
