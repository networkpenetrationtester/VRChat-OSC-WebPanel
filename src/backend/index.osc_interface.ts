import * as OSC from 'node-osc';
import { CreateIOTypeMaps, LoadLastAvatar } from './index.modules.ts';
import type { $VRC_AVI_STRUCTURE_IO_DATATYPE, $VRC_OSC_INTF_ARGS, $VRC_OSC_INTERFACE_MATCH, $VRC_OSC_INTERFACE_MATCHER } from './index.types.ts';
import { match, type Match, type MatchFunction } from 'path-to-regexp';

// TODO: superset this class to make it more generic...

export type $VRC_OSC_INTF_MSG_CB = (src: VRC_OSC_INTERFACE, match: $VRC_OSC_INTERFACE_MATCH, ...data: any[]) => any;

export class VRC_OSC_INTERFACE {
    private init = false;
    private logging = true;
    private last = LoadLastAvatar();
    private msg_callbacks = [];

    private all_matchers = new Set<$VRC_OSC_INTERFACE_MATCHER>();

    private pattern_by_matcher = new Map<$VRC_OSC_INTERFACE_MATCHER, string>();

    private matcher_by_pattern = new Map<string, $VRC_OSC_INTERFACE_MATCHER>();

    private matchers_by_address = new Map<string, Set<$VRC_OSC_INTERFACE_MATCHER> | 'none'>();

    private matcher_results_by_matcher_by_address = new Map<string, Map<$VRC_OSC_INTERFACE_MATCHER, Set<$VRC_OSC_INTERFACE_MATCH> | 'none'>>();

    private callbacks_by_pattern = new Map<string, Set<$VRC_OSC_INTF_MSG_CB>>();

    private callbacks_by_matcher = new Map<$VRC_OSC_INTERFACE_MATCHER, Set<$VRC_OSC_INTF_MSG_CB>>();

    server!: OSC.Server; // INTF <- VRC
    client!: OSC.Client; // INTF -> VRC

    CURRENT_AVI = {
        STRUCTURE: this.last?.structure,
        DATA: this.last?.data,
        TYPEMAPS: {
            IN: new Map<string, $VRC_AVI_STRUCTURE_IO_DATATYPE>(),
            OUT: new Map<string, $VRC_AVI_STRUCTURE_IO_DATATYPE>()
        }
    }

    constructor() {
        if (this.CURRENT_AVI.STRUCTURE) this.CURRENT_AVI.TYPEMAPS = CreateIOTypeMaps(this.CURRENT_AVI.STRUCTURE);
    }

    private CreateMatcher(pattern: string): $VRC_OSC_INTERFACE_MATCHER {
        let matcher: $VRC_OSC_INTERFACE_MATCHER = match(pattern);
        this.pattern_by_matcher.set(matcher, pattern);
        return matcher;
    }

    private GetMatcherByPattern(pattern: string): $VRC_OSC_INTERFACE_MATCHER {
        let matcher = this.matcher_by_pattern.get(pattern);

        if (!matcher) {
            matcher = this.CreateMatcher(pattern);
            this.matcher_by_pattern.set(pattern, matcher);
        }

        return matcher;
    }

    private GetMatchersByAddress(address: string, rescan = false) {
        let matchers = this.matchers_by_address.get(address) ?? new Set<$VRC_OSC_INTERFACE_MATCHER>();
        let matcher_results_by_matcher = this.matcher_results_by_matcher_by_address.get(address) ?? new Map<$VRC_OSC_INTERFACE_MATCHER, Set<$VRC_OSC_INTERFACE_MATCH>>();

        if (matchers === 'none' && !rescan) {
            return 'none';
        }

        if (matchers === 'none' && rescan || matchers instanceof Set && (matchers.size === 0 || matchers.size > 0 && rescan) || !matchers) {
            matchers = new Set<$VRC_OSC_INTERFACE_MATCHER>();

            for (let matcher of this.all_matchers) {
                let matcher_results = matcher_results_by_matcher.get(matcher);

                if (!matcher_results || matcher_results === 'none') {
                    matcher_results = new Set<$VRC_OSC_INTERFACE_MATCH>();
                }

                let match: $VRC_OSC_INTERFACE_MATCH = matcher(address);

                if (match) {
                    if (!matcher_results.has(match)) matcher_results.add(match);
                    if (!matchers.has(matcher)) matchers.add(matcher);

                    matcher_results_by_matcher.set(matcher, matcher_results);
                }

                this.matcher_results_by_matcher_by_address.set(address, matcher_results_by_matcher);
            }

            this.matchers_by_address.set(address, matchers.size > 0 ? matchers : 'none');
        }

        return matchers;
    }

    private GetMatcherResultsByMatcherByAddress(address: string, matcher: $VRC_OSC_INTERFACE_MATCHER, rescan = false): Set<$VRC_OSC_INTERFACE_MATCH> | 'none' {
        let matcher_results = this.matcher_results_by_matcher_by_address.get(address)?.get(matcher);

        if (matcher_results === 'none' && rescan || matcher_results instanceof Set && (matcher_results.size === 0 || matcher_results.size > 0 && rescan) || !matcher_results) {
            this.GetMatchersByAddress(address, rescan);
        }

        matcher_results = this.matcher_results_by_matcher_by_address.get(address)?.get(matcher);

        return matcher_results ? matcher_results : 'none';
    }

    private GetPatternByMatcher(matcher: $VRC_OSC_INTERFACE_MATCHER): string {
        return this.pattern_by_matcher.get(matcher) ?? '';
    }

    private AddCallbackByPattern(pattern: string, callback: $VRC_OSC_INTF_MSG_CB): boolean {
        let callbacks = this.callbacks_by_pattern.get(pattern) ?? new Set<$VRC_OSC_INTF_MSG_CB>();
        let existed = callbacks.has(callback);

        if (!existed) {
            callbacks.add(callback);
            this.callbacks_by_pattern.set(pattern, callbacks);
        }

        return !existed;
    }

    private GetCallbacksByPattern(pattern: string) {
        return this.callbacks_by_pattern.get(pattern);
    }

    private RemoveCallbackByPattern(pattern: string, callback: $VRC_OSC_INTF_MSG_CB): boolean {
        let callbacks = this.callbacks_by_pattern.get(pattern) ?? new Set<$VRC_OSC_INTF_MSG_CB>();
        let existed = callbacks.has(callback);

        if (existed) {
            callbacks.delete(callback);
            this.callbacks_by_pattern.set(pattern, callbacks);
        }

        return existed;
    }

    private AddCallbackByMatcher(matcher: $VRC_OSC_INTERFACE_MATCHER, callback: $VRC_OSC_INTF_MSG_CB): boolean {
        let callbacks = this.callbacks_by_matcher.get(matcher) ?? new Set<$VRC_OSC_INTF_MSG_CB>();
        let existed = callbacks.has(callback);

        if (!existed) {
            callbacks.add(callback);
            this.callbacks_by_matcher.set(matcher, callbacks);
        }

        return !existed;
    }

    private GetCallbacksByMatchers(matcher: $VRC_OSC_INTERFACE_MATCHER | Set<$VRC_OSC_INTERFACE_MATCHER> | 'none') {
        if (matcher === 'none') return 'none';

        let callbacks = new Set<$VRC_OSC_INTF_MSG_CB>();

        if (matcher instanceof Set) {
            for (let m of matcher) {
                let cbs = this.callbacks_by_matcher.get(m);
                if (cbs) {
                    for (let cb of cbs) {
                        callbacks.add(cb);
                    }
                }
            }
            return callbacks;
        } else {
            this.callbacks_by_matcher.get(matcher);
        }

        return callbacks ?? 'none';
    }

    private RemoveCallbackByMatcher(matcher: $VRC_OSC_INTERFACE_MATCHER, callback: $VRC_OSC_INTF_MSG_CB): boolean {
        let callbacks = this.callbacks_by_matcher.get(matcher) ?? new Set<$VRC_OSC_INTF_MSG_CB>();
        let existed = callbacks.has(callback);

        if (existed) {
            callbacks.delete(callback);
            this.callbacks_by_matcher.set(matcher, callbacks);
        }

        return existed;
    }

    Create(CONFIG: $VRC_OSC_INTF_ARGS)/* : Promise<OSC.Server> */ {
        if (this.init) this.Destroy();

        this.client = new OSC.Client(CONFIG.CLIENT_ADDRESS, CONFIG.CLIENT_PORT);

        this.server = new OSC.Server(CONFIG.SERVER_PORT, CONFIG.SERVER_ADDRESS, () => {
            console.log(`[OSC_INTF] Server listening on ${CONFIG.SERVER_ADDRESS}:${CONFIG.SERVER_PORT}...`);
        });

        this.server.on('message', (args) => {
            const [address, ...data] = args;

            let matchers = this.GetMatchersByAddress(address);
            let callbacks = this.GetCallbacksByMatchers(matchers);

            if (matchers === 'none') return;

            for (let matcher of matchers) {
                let matcher_results = this.GetMatcherResultsByMatcherByAddress(address, matcher);
                for (let callback of callbacks) {
                    if (typeof callback !== 'string') {
                        for (let matcher_result of matcher_results) {
                            if (typeof matcher_result !== 'string') {
                                callback(this, matcher_result, ...data);
                            }
                        }
                    }
                }
            }
        });

        this.server.on('close', () => this.init = false);
    }

    Destroy() {
        if (!this.init) return console.log(`[OSC_INTF] Interface not init....`);

        this.server.close();
        this.client
        this.init = false;
    }

    TrySendValue(address: string, value: any) { // TODO: implement universal OSC keys + types
        // if (!this.server_connected) return console.log(`[OSC_INTF] Server not connected....`);
        try {
            if (!value) return console.log(`[OSC_INTF => VRChat] Sender did nothing (input empty)`);

            value = value.toString();

            if (!this.CURRENT_AVI.TYPEMAPS.IN.has(address)) {
                console.log(`[OSC_INTF => VRChat] Sender trying to send ${value} => ${address} (typemap doesn't contain address)`);

                const try_int = parseInt(value);
                if (!isNaN(try_int) && try_int.toString() === value) return this.client.send(address, try_int);

                const try_float = parseFloat(value);
                if (!isNaN(try_float) && try_float.toString() === value) return this.client.send(address, try_float);

                const try_bool = ({ 'true': 1, 'false': 0 } as { [key: string]: number | undefined })[value];
                if (try_bool != undefined) return this.client.send(address, try_bool);

                console.log(`[OSC_INTF => VRChat] Sender still trying to send ${value} => ${address} (typemap doesn't contain address & failed to parse value)`);
                return this.client.send(address, value);
            }

            const datatype = this.CURRENT_AVI.TYPEMAPS.IN.get(address);

            switch (datatype) {
                case 'Bool': {
                    const try_bool = ({ 'true': 1, 'false': 0, '1': 1, '0': 1 } as { [key: string]: number | undefined })[value];

                    if (try_bool != undefined) return this.client.send(address, try_bool);

                    console.log(`[OSC_INTF => VRChat] Sender aborted send ${value} => ${address} (typemap contains address & value is not a Bool)`);
                    break;
                }

                case 'Int': {
                    const try_int = parseInt(value);

                    if (!isNaN(try_int) && try_int.toString() === value) {
                        this.client.send(address, try_int);
                        return true;
                    }

                    console.log(`[OSC_INTF => VRChat] Sender aborted send ${value} => ${address} (typemap contains address & value is not a Int)`);
                    break;
                }

                case 'Float': {
                    const try_float = parseFloat(value);

                    if (!isNaN(try_float) && try_float.toString() === value) {
                        this.client.send(address, try_float); // need some kinda nudge sometimes idk how vrchat floats fucking work sometimes they're discarded entirely, need min/max value range like 0.01274362543 for 0 and 0.9997888783 for 1
                        return true;
                    }

                    console.log(`[OSC_INTF => VRChat] Sender aborted send ${value} => ${address} (typemap contains address & value is not a Float)`);
                    break;
                }

                default: {
                    console.log(`[OSC_INTF => VRChat] Sender aborted send ${value} => ${address} (unknown datatype ${datatype})`);
                }
            }
        } catch (e) {
            console.error(e);
        }

        return false;
    }

    AddMessageListener(pattern: string, callback: $VRC_OSC_INTF_MSG_CB) {
        let matcher = this.GetMatcherByPattern(pattern);
        this.all_matchers.add(matcher);
        this.AddCallbackByPattern(pattern, callback);
        this.AddCallbackByMatcher(matcher, callback);
    }

    RemoveMessageListener(pattern: string, callback: $VRC_OSC_INTF_MSG_CB) {
        let matcher = this.GetMatcherByPattern(pattern);
        this.all_matchers.delete(matcher);
        this.RemoveCallbackByPattern(pattern, callback);
        this.RemoveCallbackByMatcher(matcher, callback);
    }

    GetMessageListeners(pattern?: string) {
        let all_callbacks: Set<$VRC_OSC_INTF_MSG_CB> | 'none' = new Set<$VRC_OSC_INTF_MSG_CB>();
        if (pattern) {
            all_callbacks = this.callbacks_by_pattern.get(pattern) ?? 'none';
        } else {
            for (let kvp of this.callbacks_by_pattern) {
                let [pattern, callbacks] = kvp;
                for (let callback of callbacks) {
                    all_callbacks.add(callback);
                }
            }
        }
        return all_callbacks;
    }
}