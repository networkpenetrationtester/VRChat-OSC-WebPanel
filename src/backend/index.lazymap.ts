export class LazyMap<K, V> extends Map<K, V> {
    constructor() {
        super();
    }

    pop() {
        let [last_key, last_value] = this.entries().toArray().pop() ?? [];
        if (last_key) this.delete(last_key);
        return last_value;
    }

    setAndReturnValue(key: K, value: V) {
        this.set(key, value);
        return value;
    }

    trySet(key: K, value: V) {
        let v = this.get(key);
        ((v ??= value) === value) && this.set(key, v);
        return this;
    }

    trySetAndReturnValue(key: K, value: V): V {
        let v = this.get(key);
        ((v ??= value) === value) && this.set(key, v);
        return v;
    }
}