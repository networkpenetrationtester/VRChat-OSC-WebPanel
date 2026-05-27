export class LazyMap<K, V> extends Map<K, V> {
    constructor() {
        super();
    }

    shift() {
        let [last_key, last_value] = this.entries().toArray().shift() ?? [];
        last_key && this.delete(last_key);
        return [last_key, last_value];
    }

    pop() {
        let [last_key, last_value] = this.entries().toArray().pop() ?? [];
        last_key && this.delete(last_key);
        return [last_key, last_value];
    }

    trySet(key: K, value: V) {
        let v = this.get(key);
        ((v ??= value) === value) && this.set(key, v);
        return this;
    }

    setAndReturnValue(key: K, value: V) {
        this.set(key, value);
        return value;
    }

    trySetAndReturnValue(key: K, value: V): V {
        let v = this.get(key);
        ((v ??= value) === value) && this.set(key, v);
        return v;
    }
}