import { query } from '$app/server';
import { Interface } from '$lib/init';

export const AvatarGenerator = query.live(async function* () {
    while (true) {
        yield Interface.avatar;
        await new Promise(resolve => setTimeout(resolve, 100));
    }
});