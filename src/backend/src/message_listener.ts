/* eslint-disable @typescript-eslint/no-explicit-any */
import { MD5 } from 'object-hash';
import { match } from 'path-to-regexp';
import { LazyMap } from './lazymap.ts';
import { PathToRegExpMatchToMap } from './modules.ts';
import type {
  $PathToRegExpResult,
  $PathToRegExpMatcher,
  $MessageListenerCallback,
  $MessageListenerPMCObject
} from './types.ts';

export class MessageListener {
  protected pmc_by_hash = new LazyMap<string, $MessageListenerPMCObject>();
  protected matcher_by_pattern = new LazyMap<string, $PathToRegExpMatcher>();

  protected known_addresses = new Array<string>();
  protected pmc_checks_by_address = new LazyMap<string, Array<$MessageListenerPMCObject>>();
  protected pmc_cache_by_address = new LazyMap<string, Array<[string, $PathToRegExpResult]>>();

  HandleData(src: any, address: string, ...values: any[]) {
    !this.known_addresses.includes(address) && this.known_addresses.push(address);

    const pmc_cache =
      this.pmc_cache_by_address.get(address) ?? this.pmc_cache_by_address.setAndReturnValue(address, new Array());

    for (const caught of pmc_cache) {
      const [caught_hash, caught_match] = caught;
      caught_match && this.pmc_by_hash.get(caught_hash)?.callback(src, PathToRegExpMatchToMap(caught_match), address, ...values);
    }

    let pmc_checks =
      this.pmc_checks_by_address.get(address) ??
      this.pmc_checks_by_address.setAndReturnValue(address, this.pmc_by_hash.values().toArray());

    if (pmc_checks.length > 0) {
      for (const pmc_check of pmc_checks) {
        const { matcher, callback } = pmc_check;
        const match = matcher(address);
        if (match) {
          callback(src, PathToRegExpMatchToMap(match), address, ...values);
          pmc_cache.push([MD5(pmc_check), match]);
        }
        pmc_checks = pmc_checks.slice(1);
      }
      this.pmc_checks_by_address.set(address, pmc_checks);
    }
  }

  AddMessageListener(pattern: string, callback: $MessageListenerCallback<any>) {
    const matcher = this.matcher_by_pattern.trySetAndReturnValue(pattern, match(pattern));

    const ref_pmc = { pattern, matcher, callback };
    const ref_hash = MD5(ref_pmc);

    let pmc = this.pmc_by_hash.get(ref_hash);

    if (!pmc) {
      pmc = this.pmc_by_hash.setAndReturnValue(ref_hash, ref_pmc);

      for (const address of this.known_addresses) {
        let pmc_checks = this.pmc_checks_by_address.get(address);
        pmc_checks ??= [];
        pmc_checks.push(pmc);
        this.pmc_checks_by_address.set(address, pmc_checks);
      }
    }
  }

  RemoveMessageListener(pattern: string, callback: $MessageListenerCallback<any>) {
    const matcher = this.matcher_by_pattern.get(pattern);
    if (!matcher) return;

    const ref_pmc = { pattern, matcher, callback };
    const ref_hash = MD5(ref_pmc);

    const pmc = this.pmc_by_hash.get(ref_hash);

    if (pmc) {
      for (const address of this.known_addresses) {
        const pmc_checks = this.pmc_checks_by_address.get(address);
        if (pmc_checks) {
          this.pmc_checks_by_address.set(
            address,
            pmc_checks.filter(pmc_check => pmc_check !== pmc)
          );
        }

        const cache = this.pmc_cache_by_address.get(address);
        if (cache) {
          this.pmc_cache_by_address.set(
            address,
            cache.filter(caught => this.pmc_by_hash.get(caught[0]) !== pmc)
          );
        }
      }
      this.pmc_by_hash.delete(ref_hash);
      // We do NOT want to delete matcher_by_pattern.
    }
  }

  GetMessageListeners() {
    return this.pmc_by_hash
      .values()
      .toArray()
      .map((pmc: $MessageListenerPMCObject) => ({ pattern: pmc.pattern, callback: pmc.callback }));
  }

  GetMessageListenersByAddress(target_address: string) {
    return (this.pmc_cache_by_address.get(target_address)?.map(([pmc_hash]) => {
      const pmc = this.pmc_by_hash.get(pmc_hash);
      if (pmc) return { pattern: pmc.pattern, callback: pmc.callback };
    }) ?? []) as Array<{ pattern: string; callback: $MessageListenerCallback<any> }>;
  }

  GetMessageListenersByPattern(target_pattern: string) {
    return this.pmc_by_hash
      .values()
      .toArray()
      .filter(pmc => pmc.pattern === target_pattern)
      .map(pmc => ({ pattern: pmc.pattern, callback: pmc.callback }));
  }

  GetMessageListenersByCallback(target_callback: $MessageListenerCallback<any>) {
    return this.pmc_by_hash
      .values()
      .toArray()
      .filter(pmc => pmc.callback === target_callback)
      .map(pmc => ({ pattern: pmc.pattern, callback: pmc.callback }));
  }
}
