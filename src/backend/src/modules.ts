import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import rl from 'readline';
import { LazyMap } from './lazymap.ts';
import { PROJECT_ROOT } from './constants.ts';
import type { ReadLineOptions } from 'readline';
import type {
	$VRChatAvatarStructure,
	$VRChatAPIAvatarData,
	$VRChatAvatarStructureIODatatype,
	$VRChatAvatarData,
	$PathToRegExpResult,
	$VRChatOSCInterfaceAvatarTypeMap,
	$VRChatOSCInterfaceCurrentAvatar
} from './types.ts';

export function TryParse(...values: unknown[]) {
	try {
		if (!values) throw new Error('Value empty');

		values = values.map(value => {
			if (value) {
				const value_stringified = new String(value).toString() ?? '';
				const [v, explicit_type] = [value_stringified.slice(0, -1), value_stringified.at(value_stringified.length - 1)];

				const is_bool = ['true', 'false'].includes(value_stringified);
				if (is_bool) return { true: 1, false: 0 }[value_stringified];

				const v_int = parseInt(value_stringified);
				const v_float = parseFloat(value_stringified);

				switch (
					explicit_type // This handles <number>i <number>f <number>b, etc.
				) {
					case 'i':
						return v_int;
					case 'f':
						return Math.fround(v_float);
					case 'b':
						return parseInt(v);
					default:
						break;
				}

				if (!isNaN(v_int) && v_int.toString() === value_stringified) return v_int;
				if (!isNaN(v_float)) return Math.fround(v_float + (v_float == Math.trunc(v_float) ? Math.random() / 100 : 0));

				throw new Error('Failed guess parse');
			} else {
				throw new Error('Value(s) empty');
			}
		});
		console.log(values);
		return values;
	} catch (e) {
		console.log(chalk.bgRed(`[TryParse] Failed to parse '${JSON.stringify(values)}'. (${e})`));
		return [];
	}
}

export function STDIO(options?: ReadLineOptions) {
	return rl.createInterface({ ...options, input: process.stdin, output: process.stdout });
}

export function RemoveUTF8BOM(data: string) {
	return new String(data).replace(/\ufeff/g, '');
}

export function PathToRegExpMatchToMap(match: $PathToRegExpResult) {
	const map = new LazyMap<string, string | string[]>();

	if (!match) return map; // blame path-to-regexp

	map.set('$address', match.path);

	for (const kvp of Object.entries(match.params)) map.set(...kvp);

	return map;
}

export function AvatarStructureLoader(VRC_AVI_OSC_DIR: string, avi_id: string): $VRChatAvatarStructure | undefined {
	const avi_osc_path = path.join(VRC_AVI_OSC_DIR, avi_id + '.json');

	if (!fs.existsSync(avi_osc_path)) {
		console.log(chalk.bgYellow(`[AvatarStructureLoader] Failed to locate file '${avi_osc_path}'.`));
		return;
	}

	try {
		return JSON.parse(RemoveUTF8BOM(fs.readFileSync(avi_osc_path, 'utf8')));
	} catch (e) {
		console.log(chalk.bgRed(`[AvatarStructureLoader] Failed to parse '${avi_osc_path}'. (${e})`));
		return;
	}
}

export function AvatarDataLoader(VRC_AVI_DATA_DIR: string, avi_id: string): $VRChatAvatarData | undefined {
	const avi_data_path = path.join(VRC_AVI_DATA_DIR, avi_id);

	if (!fs.existsSync(avi_data_path)) {
		console.log(chalk.bgYellow(`[AvatarDataLoader] Failed to locate file '${avi_data_path}'.`));
		return;
	}

	try {
		return JSON.parse(RemoveUTF8BOM(fs.readFileSync(avi_data_path, 'utf8')));
	} catch (e) {
		console.log(chalk.bgRed(`[AvatarStructureLoader] Failed to parse '${avi_data_path}'. (${e})`));
		return;
	}
}

export function LoadLastAvatar(): { structure: $VRChatAvatarStructure; data: $VRChatAvatarData } | undefined {
	const last_avi_path = path.join(PROJECT_ROOT, 'last.json');

	if (!fs.existsSync(last_avi_path)) {
		console.log(chalk.bgYellow(`[LoadLastAvatar] Failed to locate '${last_avi_path}'.`));
		return;
	}

	try {
		return JSON.parse(fs.readFileSync(last_avi_path, 'utf8'));
	} catch (e) {
		console.log(chalk.bgRed(`[LoadLastAvatar] Failed to parse '${last_avi_path}'. (${e})`));
		return;
	}
}

export function SaveLastAvatar(avatar: $VRChatOSCInterfaceCurrentAvatar) {
	const { structure, data } = avatar;
	fs.writeFileSync(path.join(PROJECT_ROOT, 'last.json'), JSON.stringify({ structure, data }));
}

export function GenerateAvatarTypeMap(vrc_avi_structure?: $VRChatAvatarStructure): $VRChatOSCInterfaceAvatarTypeMap {
	const inputs = new LazyMap<string, $VRChatAvatarStructureIODatatype>();
	const outputs = new LazyMap<string, $VRChatAvatarStructureIODatatype>();

	if (vrc_avi_structure) {
		for (const parameter of vrc_avi_structure.parameters) {
			parameter.input && inputs.set(parameter.input.address, parameter.input.type);
			parameter.output && outputs.set(parameter.output.address, parameter.output.type);
			parameter.writable = !!parameter.input;
		}
	}

	return { inputs, outputs };
}

export async function GetAvatarDetails(
	avi_id: string,
	cookie: { auth?: string; twoFactorAuth?: string },
	getListingData = false
): Promise<$VRChatAPIAvatarData | undefined> {
	if (!cookie.auth) {
		console.log(chalk.bgRed(`[GetAvatarDetails] Failed because 'auth' was not specified.`));
		return;
	}
	if (!cookie.twoFactorAuth) {
		console.log(chalk.bgYellow(`[GetAvatarDetails] May fail because 'twoFactorAuth' was not specified.`));
	}

	try {
		return await fetch(`https://api.vrchat.cloud/api/1/avatars/${avi_id}?getListingData=${getListingData}`, {
			headers: {
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
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36' // TODO: make funny :3
			},
			method: 'GET'
		}).then(r => r.json());
	} catch (e) {
		console.log(chalk.bgRed(`[GetAvatarDetails] Failed to fetch. (${e})`));
		return;
	}
}

export async function GetUserDetails() {
	// TODO: fs.watch
}

// TODO: GUI stuff?
