import fs from 'node:fs';
import path from 'node:path';
import rl from 'node:readline';
import type { $VRC_AVI_STRUCTURE, $VRC_AVI_API_DATA, $VRC_AVI_STRUCTURE_IO_DATATYPE, $VRC_AVI_DATA, $SIMPLE_PATH_TO_REGEXP_MATCH } from './index.types.ts';
import { LazyMap } from './index.lazymap.ts';

// import lodash from 'lodash';

// export function FindExistingInstanceInSetOrMap<T>(obj_a: T, set: Set<T> | Map<any, T>): T | undefined {
//     for (let obj_b of set.values()) {
//         if (lodash.isEqual(obj_b, obj_a)) {
//             return obj_b;
//         }
//     }
// }

export function TryParse(...values: any[]) { // TODO: typegaurd?
    return values.map(value => {
        try {
            if (value) {
                let stringified = value.toString();

                switch (stringified) {
                    case 'i':
                        break;
                    case 'f':
                        
                }

                const try_int = parseInt(stringified);
                if (!isNaN(try_int) && try_int.toString() === value) return try_int;

                const try_float = parseFloat(stringified);
                if (!isNaN(try_float)) return Math.fround(try_float);

                const try_bool = ({ 'true': 1, 'false': 0 } as { [key: string]: number | undefined })[stringified];
                return try_bool ?? false;
            }
        } catch (e) {
            return;
        }
    }).filter(value => value !== null && value !== undefined);
}

export function STDIO() {
    return rl.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

export function RemoveUTF8BOM(string: string) {
    return string.replaceAll('\ufeff', '');
}

export function PathToRegExpMatchToMap(match: $SIMPLE_PATH_TO_REGEXP_MATCH) {
    let map = new LazyMap<string, any>();
    if (!match) return map; // blame path-to-regexp
    map.set('$address', match.path);
    for (let kvp of Object.entries(match.params)) map.set(...kvp);
    return map;
}

export function AvatarStructureLoader(VRC_AVI_OSC_DIR: string, avi_id: string): $VRC_AVI_STRUCTURE | undefined {
    let avi_osc_path = path.join(VRC_AVI_OSC_DIR, avi_id + '.json');

    if (!fs.existsSync(avi_osc_path)) {
        console.error(`directory does not exist ${avi_osc_path}`);
        return;
    }

    try {
        return JSON.parse(RemoveUTF8BOM(fs.readFileSync(avi_osc_path, 'utf8')));
    } catch (e) {
        console.error(e);
        return;
    }
}

export function AvatarDataLoader(VRC_AVI_DATA_DIR: string, avi_id: string): $VRC_AVI_DATA | undefined {
    let avi_data_path = path.join(VRC_AVI_DATA_DIR, avi_id);

    if (!fs.existsSync(avi_data_path)) {
        console.error(`directory does not exist ${avi_data_path}`);
        return;
    }

    try {
        return JSON.parse(RemoveUTF8BOM(fs.readFileSync(avi_data_path, 'utf8')));
    } catch (e) {
        console.error(e);
        return;
    }
}

// TODO: AvatarDataLoader

export function LoadLastAvatar(): { data: $VRC_AVI_DATA, structure: $VRC_AVI_STRUCTURE } | undefined {
    try {
        return JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'last.json'), 'utf8'));
    } catch (e) {
        return;
    }
}

export function SaveLastAvatar(data: $VRC_AVI_DATA, structure: $VRC_AVI_STRUCTURE) {
    fs.writeFileSync(path.join(import.meta.dirname, 'last.json'), JSON.stringify({ data, structure }));
}

export function CreateIOTypeMaps(vrc_avi_structure: $VRC_AVI_STRUCTURE) {
    let IN = new LazyMap<string, $VRC_AVI_STRUCTURE_IO_DATATYPE>();
    let OUT = new LazyMap<string, $VRC_AVI_STRUCTURE_IO_DATATYPE>();

    for (let parameter of vrc_avi_structure.parameters) {
        parameter.input && IN.set(parameter.input.address, parameter.input.type);
        parameter.output && OUT.set(parameter.output.address, parameter.output.type);
    }

    return { IN, OUT };
}

export async function GetAvatarDetails(avi_id: string, cookie: { auth?: string, twoFactorAuth?: string }, getListingData = false): Promise<$VRC_AVI_API_DATA | undefined> {
    if (!cookie.auth) { console.error('auth not specified'); return; }
    if (!cookie.twoFactorAuth) { console.error('twoFactorAuth not specified, continuing...'); }

    try {
        return await fetch(`https://api.vrchat.cloud/api/1/avatars/${avi_id}?getListingData=${getListingData}`, {
            'headers': {
                'accept': 'application/json',
                'accept-language': 'en-US,en;q=0.9',
                'cache-control': 'no-cache',
                'pragma': 'no-cache',
                'priority': 'u=1, i',
                'sec-ch-ua': '"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"', // TODO: make funny :3
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'cookie': `auth=${cookie.auth};${cookie.twoFactorAuth ? ' twoFactorAuth=' + cookie.twoFactorAuth : ''}`,
                'Referer': `https://vrchat.com/home/avatar/${avi_id}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36' // TODO: make funny :3
            },
            'method': 'GET'
        }).then(r => r.json());
    } catch (e) {
        console.error(e);
        return;
    }
}