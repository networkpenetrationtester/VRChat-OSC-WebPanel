export class LazyMap<K, V> extends Map<K, V> {
	constructor() {
		super();
	}

	shift() {
		const [last_key, last_value] = this.entries().toArray().shift() ?? [];
		last_key && this.delete(last_key);
		return [last_key, last_value];
	}

	pop() {
		const [last_key, last_value] = this.entries().toArray().pop() ?? [];
		last_key && this.delete(last_key);
		return [last_key, last_value];
	}

	trySet(key: K, value: V) {
		let prev_value = this.get(key);
		(prev_value ??= value) === value && this.set(key, prev_value);
		return this;
	}

	setAndReturnValue(key: K, value: V) {
		this.set(key, value);
		return value;
	}

	trySetAndReturnValue(key: K, value: V): V {
		let prev_value = this.get(key);
		(prev_value ??= value) === value && this.set(key, prev_value);
		return prev_value;
	}
}
