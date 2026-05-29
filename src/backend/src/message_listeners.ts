/* eslint-disable @typescript-eslint/no-explicit-any */
import { MD5 } from 'object-hash';
import { match as createMatcher } from 'path-to-regexp';
import { LazyMap } from './lazymap.ts';
import { PathToRegExpMatchToMap } from './modules.ts';
import type { $PathToRegExpResult, $PathToRegExpMatcher, $MessageListenerCallback, $MessageListenerPMCObject } from './types.ts';

export class MessageListeners {
    private pmc_by_hash = new LazyMap<string, $MessageListenerPMCObject>();
    private matcher_by_pattern = new LazyMap<string, $PathToRegExpMatcher>();
    private known_addresses = new Array<string>();
    private pmc_checks_by_address = new LazyMap<string, Array<$MessageListenerPMCObject>>();
    private pmc_cache_by_address = new LazyMap<string, Array<[string, $PathToRegExpResult]>>();

    HandleData(src: any, address: string, ...data: unknown[]) {
        !this.known_addresses.includes(address) && this.known_addresses.push(address);

        let pmc_cache = this.pmc_cache_by_address.get(address) ?? this.pmc_cache_by_address.setAndReturnValue(address, new Array());

        for (let caught of pmc_cache) {
            let [caught_hash, caught_match] = caught;
            caught_match && this.pmc_by_hash.get(caught_hash)?.callback(src, PathToRegExpMatchToMap(caught_match), ...data);
        }

        let pmc_checks = this.pmc_checks_by_address.get(address) ?? this.pmc_checks_by_address.setAndReturnValue(address, this.pmc_by_hash.values().toArray());

        if (pmc_checks.length > 0) {
            for (let pmc_check of pmc_checks) {
                let { matcher, callback } = pmc_check;
                let match = matcher(address);
                if (match) {
                    callback(src, PathToRegExpMatchToMap(match), ...data);
                    pmc_cache.push([MD5(pmc_check), match]); // funnily enough this was used above and shit
                }
                pmc_checks = pmc_checks.slice(1);
            }
            this.pmc_checks_by_address.set(address, pmc_checks);
        }
    }

    AddMessageListener(pattern: string, callback: $MessageListenerCallback<any>) {
        let matcher = this.matcher_by_pattern.get(pattern) ?? this.matcher_by_pattern.setAndReturnValue(pattern, createMatcher(pattern));

        let ref_pmc = { pattern, matcher, callback };
        let ref_hash = MD5(ref_pmc);

        let pmc = this.pmc_by_hash.get(ref_hash);

        if (!pmc) {
            pmc = this.pmc_by_hash.setAndReturnValue(ref_hash, ref_pmc);

            for (let address of this.known_addresses) {
                let pmc_checks = this.pmc_checks_by_address.get(address);
                pmc_checks ??= [];
                pmc_checks.push(pmc);
                this.pmc_checks_by_address.set(address, pmc_checks);
            }
        }
    }

    RemoveMessageListener(pattern: string, callback: $MessageListenerCallback<any>) {
        let matcher = this.matcher_by_pattern.get(pattern);
        if (!matcher) return;

        let ref_pmc = { pattern, matcher, callback };
        let ref_hash = MD5(ref_pmc);

        let pmc = this.pmc_by_hash.get(ref_hash);

        if (pmc) {
            for (let address of this.known_addresses) {
                let pmc_checks = this.pmc_checks_by_address.get(address);
                if (pmc_checks) {
                    this.pmc_checks_by_address.set(address, pmc_checks.filter(pmc_check => pmc_check !== pmc));
                }

                let cache = this.pmc_cache_by_address.get(address);
                if (cache) {
                    this.pmc_cache_by_address.set(address, cache.filter(caught => this.pmc_by_hash.get(caught[0]) !== pmc)); // LEAVES THE CACHE INITIALIZED IF EMPTY WHICH IS INTENDED BEHAVIOR
                }
            }
            this.pmc_by_hash.delete(ref_hash);
            // THOUGH WE STILL DO >>>NOT<<< WANT TO DELETE matcher_by_pattern BECAUSE OTHER PMC's MAY STILL USE IT.
        }
    }

    GetMessageListeners() {
        return this.pmc_by_hash.values().toArray().map((pmc: $MessageListenerPMCObject) => ({ pattern: pmc.pattern, callback: pmc.callback }));
    }

    GetMessageListenersByAddress(target_address: string) {
        return (this.pmc_cache_by_address.get(target_address)?.map(([pmc_hash]) => {
            let pmc = this.pmc_by_hash.get(pmc_hash); if (pmc) return { pattern: pmc.pattern, callback: pmc.callback };
        }) ?? []) as Array<{ pattern: string, callback: $MessageListenerCallback<any> }>;
    }

    GetMessageListenersByPattern(target_pattern: string) {
        return this.pmc_by_hash.values().toArray().filter(pmc => pmc.pattern === target_pattern).map(pmc => ({ pattern: pmc.pattern, callback: pmc.callback }));
    }

    GetMessageListenersByCallback(target_callback: $MessageListenerCallback<any>) {
        return this.pmc_by_hash.values().toArray().filter(pmc => pmc.callback === target_callback).map(pmc => ({ pattern: pmc.pattern, callback: pmc.callback }));
    }
}