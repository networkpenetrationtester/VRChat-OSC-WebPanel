import { match } from 'path-to-regexp';
import type { $SIMPLE_PATH_TO_REGEXP_MATCH, $SIMPLE_PATH_TO_REGEXP_MATCHER, $VRC_LISTENERS_MSG_CB } from './index.types.ts';
import { FindExistingInstanceInSetOrMap, PathToRegExpMatchToMap } from './index.modules.ts';
import lodash from 'lodash';
const { isEqual } = lodash;

export class MessageListeners {
    private matcher_by_pattern_map = new Map<string, $SIMPLE_PATH_TO_REGEXP_MATCHER>();
    private pattern_by_matcher_map = new Map<$SIMPLE_PATH_TO_REGEXP_MATCHER, string>();
    private pattern_matcher_callback_set = new Set<{ pattern: string, matcher: $SIMPLE_PATH_TO_REGEXP_MATCHER, callback: $VRC_LISTENERS_MSG_CB<any> }>();
    private known_address_set = new Set<string>();
    private cache_by_address_map = new Map<string, Set<{ pattern: string, matcher: $SIMPLE_PATH_TO_REGEXP_MATCHER, match: $SIMPLE_PATH_TO_REGEXP_MATCH, callback: $VRC_LISTENERS_MSG_CB<any> }>>(); // 1. Did we already scan all matchers for this (can throw in matcher if you'd like i guess)? 2. Need a way to be able to remove entries when unloading MessageListener combo (address, callback) 3. Store results and callbacks (match)
    private checks_by_address_map = new Map<string, Set<{ pattern: string, matcher: $SIMPLE_PATH_TO_REGEXP_MATCHER, callback: $VRC_LISTENERS_MSG_CB<any> }>>();

    ProcessAddress<T>(src: T, address: string, ...data: any[]) {
        this.known_address_set.add(address);

        let cache = this.cache_by_address_map.get(address);
        if (!cache) {
            cache = new Set();
            for (let pattern_matcher_callback of this.pattern_matcher_callback_set) {
                let match = pattern_matcher_callback.matcher(address);
                if (match) {
                    cache.add({ ...pattern_matcher_callback, match });
                    pattern_matcher_callback.callback(src, PathToRegExpMatchToMap(match), ...data);
                }
            }
            this.cache_by_address_map.set(address, cache);
        } else {
            for (let caught of cache) {
                caught.callback(src, PathToRegExpMatchToMap(caught.match), ...data);
            }
        }

        let checks = this.checks_by_address_map.get(address);
        if (!checks) {
            this.checks_by_address_map.set(address, new Set());
        } else if (checks.size > 0) {
            for (let check of checks) {
                let match = check.matcher(address);
                if (match) {
                    cache.add({ ...check, match });
                    check.callback(src, PathToRegExpMatchToMap(match), ...data);
                }
            }
        }
    }

    GetMatcherByPattern(pattern: string): $SIMPLE_PATH_TO_REGEXP_MATCHER {
        return this.matcher_by_pattern_map.get(pattern) ?? match(pattern);
    }

    AddMessageListener(pattern: string, callback: $VRC_LISTENERS_MSG_CB<any>) { // with sets, don't need to worry about duplicate values
        let matcher = this.GetMatcherByPattern(pattern);
        let matcher_callback = { matcher, callback };
        let pattern_matcher_callback = { pattern, ...matcher_callback };

        let existing_pattern_matcher_callback = FindExistingInstanceInSetOrMap(pattern_matcher_callback, this.pattern_matcher_callback_set);

        if (!existing_pattern_matcher_callback) {
            this.pattern_matcher_callback_set.add(pattern_matcher_callback);
            this.pattern_by_matcher_map.set(matcher, pattern);
            this.matcher_by_pattern_map.set(pattern, matcher);

            for (let address of this.known_address_set) { // add to all addresss' shit 
                let checks = this.checks_by_address_map.get(address) ?? new Set();
                checks.add(pattern_matcher_callback);
                this.checks_by_address_map.set(address, checks);
            }
        }
    }

    RemoveMessageListener(pattern: string, callback: $VRC_LISTENERS_MSG_CB<any>) {
        let matcher = this.GetMatcherByPattern(pattern);
        let matcher_callback = { matcher, callback };
        let pattern_matcher_callback = { pattern, ...matcher_callback };

        let existing_pattern_matcher_callback = FindExistingInstanceInSetOrMap(pattern_matcher_callback, this.pattern_matcher_callback_set);

        if (existing_pattern_matcher_callback) {
            this.pattern_matcher_callback_set.delete(existing_pattern_matcher_callback);

            for (let address of this.known_address_set) { // add to all addresss' shit 
                let checks = this.checks_by_address_map.get(address);
                checks?.delete(existing_pattern_matcher_callback);
                this.checks_by_address_map.delete(address);

                let cache = this.cache_by_address_map.get(address);
                for (let caught of cache ?? []) {
                    let caught_matcher_callback = { matcher: caught.matcher, callback: caught.callback };
                    if (isEqual(caught_matcher_callback, matcher_callback)) {
                        console.log("DELETED CACHE!!!!!!!!");
                        cache?.delete(caught);
                    }
                }
            }
        }
    }

    GetMessageListeners() {
        let message_listeners = [];
        for (let pattern_matcher_callback of this.pattern_matcher_callback_set) {
            let { pattern, callback } = pattern_matcher_callback;
            message_listeners.push({ pattern, callback }); // this object instancing shit maaaaaaaay be an issue in rare cases but if you wanted to remove it I tnk it should be fine
        }
        return message_listeners;
    }

    GetMessageListenersByaddress(address: string) {
        let message_listeners = [];
        for (let cache of this.cache_by_address_map.get(address) ?? []) {
            let { pattern, callback } = cache;
            message_listeners.push({ pattern, callback });
        }
        return message_listeners;
    }

    GetMessageListenersByPattern(target_pattern: string) {
        let message_listeners = [];
        for (let pattern_matcher_callback of this.pattern_matcher_callback_set) {
            let { pattern, callback } = pattern_matcher_callback;
            if (pattern === target_pattern) message_listeners.push({ pattern, callback });
        }
        return message_listeners;
    }

    GetMessageListenersByCallback(target_callback: $VRC_LISTENERS_MSG_CB<any>) {
        let message_listeners = [];
        for (let pattern_matcher_callback of this.pattern_matcher_callback_set) {
            let { pattern, callback } = pattern_matcher_callback;
            if (callback === target_callback) message_listeners.push({ pattern, callback });
        }
        return message_listeners;
    }
}