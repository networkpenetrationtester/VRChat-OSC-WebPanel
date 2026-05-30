// inspired by VOR
import { MD5 } from 'object-hash';
import { LazyMap } from './lazymap.ts';
import { MessageListener as MessageListener } from './message_listener.ts';
import type { $MessageListenerCallback, $MessageListenerPMCObject, $OSCRouterExternalApplication } from './types.ts';
import * as OSC from 'node-osc';
import { match } from 'path-to-regexp';
import dgram from 'dgram';

export interface $OSCRouterForwarder {
  (address: string, ...data: any[]): any
}

export class OSCRouter extends MessageListener {
  protected app_by_hash = new LazyMap<string, $OSCRouterExternalApplication>();
  protected callback_by_app_hash = new LazyMap<string, $MessageListenerCallback<OSCRouter>>();
  protected pmc_by_app_hash = new LazyMap<string, $MessageListenerPMCObject>();

  protected client!: dgram.Socket;

  // TODO: internal router functions. They can be created and appended to a list to keep in memory for reference
  // TODO: generator for said router functions. Just an ordinary pmc :D (Route function creates + this.AddListener's)

  constructor(/* ...external_applications: $OSCRouterExternalApplication[] */) {
    super();
    this.client = dgram.createSocket('udp4');
  }

  Route(pattern: string, app: $OSCRouterExternalApplication) {
    const app_hash = MD5(app);
    this.app_by_hash.trySetAndReturnValue(app_hash, app);
    const callback = this.callback_by_app_hash.trySetAndReturnValue(pattern, (src, map, ...data) => {

    });

    // this.AddMessageListener();
  }

  UnRoute(pattern: string, app: $OSCRouterExternalApplication) {
    const app_hash = MD5(app);
    this.app_by_hash.delete(app_hash);
    const matcher = this.matcher_by_pattern.get(pattern);
    if (!matcher) return;
    const callback = this.
  }
}
