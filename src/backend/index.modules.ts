import fs from 'node:fs';
import path from 'node:path';
import rl from 'node:readline';
import type { $VRC_AVI_STRUCTURE, $VRC_AVI_API_DATA, $VRC_AVI_STRUCTURE_IO_DATATYPE, $VRC_AVI_DATA, $VRC_OSC_INTERFACE_MATCH } from './index.types.ts';

export function STDIO() { return rl.createInterface({ input: process.stdin, output: process.stdout }) };

export function RemoveUTF8BOM(string: string) { return string.replaceAll('\ufeff', ''); }

export function OSCInterfaceCBHelper(match: $VRC_OSC_INTERFACE_MATCH) {
    if (!match) return new Map<string, any>(); // blame path-to-regexp
    const { params } = match;
    let map = new Map<string, any>();
    for (let kvp of Object.entries(params)) map.set(kvp[0], kvp[1]);
    map.set('path', match.path);
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
    let IN = new Map<string, $VRC_AVI_STRUCTURE_IO_DATATYPE>();
    let OUT = new Map<string, $VRC_AVI_STRUCTURE_IO_DATATYPE>();

    for (let parameter of vrc_avi_structure.parameters) {
        parameter.input && IN.set(parameter.input.address, parameter.input.type);
        parameter.output && OUT.set(parameter.output.address, parameter.output.type);
    }

    return { IN, OUT };
}

export async function GetAvatarDetails(avi_id: string, cookie: { auth?: string, twoFactorAuth?: string }, getListingData = false): Promise<$VRC_AVI_API_DATA | undefined> {
    if (!cookie.auth) { console.error(`auth not specified`); return; }
    if (!cookie.twoFactorAuth) { console.error(`twoFactorAuth not specified`); return; }

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
                'cookie': `auth=${cookie.auth}; twoFactorAuth=${cookie.twoFactorAuth}`,
                'Referer': `https://vrchat.com/home/avatar/${avi_id}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36' // TODO: make funny :3
            },
            "body": null,
            "method": "GET"
        }).then(r => r.json());
    } catch (e) {
        console.error(e);
        return;
    }
}