import chalk from 'chalk';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline';
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

export function LogUplink(tag: string, address: string, ...values: unknown[]) {
	console.log(chalk.hex('#00ff00')(`⬆ [${tag}]`), chalk.yellow(address), ...values);
}

export function LogDownlink(tag: string, address: string, ...values: unknown[]) {
	console.log(chalk.hex('#ff0000')(`⬇ [${tag}]`), chalk.yellow(address), ...values);
}

export function ColorError(value: unknown) {
	return chalk.hex('#ff00ff')(value);
}

export function ColorWarn(value: unknown) {
	return chalk.hex('#ffff00')(value);
}

export function ColorInfo(value: unknown) {
	return chalk.hex('#00ffff')(value);
}

export function LogError(...args: unknown[]) {
	const colored_args = args.map(arg => ColorError(arg));
	console.log(...colored_args);
}

export function LogWarn(...args: unknown[]) {
	const colored_args = args.map(arg => ColorWarn(arg));
	console.log(...colored_args);
}

export function LogInfo(...args: unknown[]) {
	const colored_args = args.map(arg => ColorInfo(arg));
	console.log(...colored_args);
}

export function TryParse(...values: unknown[]) {
	try {
		if (values.length === 0) throw 'no values';

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

				throw 'failed guess parse';
			} else {
				throw 'at least one value empty';
			}
		});

		return values;
	} catch (e) {
		console.error(ColorError(`[TryParse] Failed to parse '${JSON.stringify(values)}'. (${e})`));
		return [];
	}
}

export function STDIO(options?: ReadLineOptions) {
	return createInterface({ ...options, input: process.stdin, output: process.stdout });
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
	const avi_osc_path = join(VRC_AVI_OSC_DIR, avi_id + '.json');

	if (!existsSync(avi_osc_path)) {
		LogWarn(`[AvatarStructureLoader] Failed to locate file '${avi_osc_path}'.`);
		return;
	}

	try {
		return JSON.parse(RemoveUTF8BOM(readFileSync(avi_osc_path, 'utf8')));
	} catch (e) {
		LogError(`[AvatarStructureLoader] Failed to parse '${avi_osc_path}'. (${e})`);
		return;
	}
}

export function AvatarDataLoader(VRC_AVI_DATA_DIR: string, avi_id: string): $VRChatAvatarData | undefined {
	const avi_data_path = join(VRC_AVI_DATA_DIR, avi_id);

	if (!existsSync(avi_data_path)) {
		LogWarn(`[AvatarDataLoader] Failed to locate file '${avi_data_path}'.`);
		return;
	}

	try {
		return JSON.parse(RemoveUTF8BOM(readFileSync(avi_data_path, 'utf8')));
	} catch (e) {
		LogError(`[AvatarStructureLoader] Failed to parse '${avi_data_path}'. (${e})`);
		return;
	}
}

export function LoadLastAvatar(): { structure: $VRChatAvatarStructure; data: $VRChatAvatarData } | undefined {
	const last_avi_path = join(PROJECT_ROOT, 'last.json');

	if (!existsSync(last_avi_path)) {
		LogWarn(`[LoadLastAvatar] Failed to locate '${last_avi_path}'.`);
		return;
	}

	try {
		return JSON.parse(readFileSync(last_avi_path, 'utf8'));
	} catch (e) {
		LogError(`[LoadLastAvatar] Failed to parse '${last_avi_path}'. (${e})`);
		return;
	}
}

export function SaveLastAvatar(avatar: $VRChatOSCInterfaceCurrentAvatar) {
	const { structure, data } = avatar;
	writeFileSync(join(PROJECT_ROOT, 'last.json'), JSON.stringify({ structure, data }));
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
		LogError(`[GetAvatarDetails] Failed because 'auth' was not specified.`);
		return;
	}

	if (!cookie.twoFactorAuth) LogWarn(`[GetAvatarDetails] May fail because 'twoFactorAuth' was not specified.`);

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
		LogError(`[GetAvatarDetails] Failed to fetch. (${e})`);
		return;
	}
}

export async function GetUserDetails() {
	// TODO: fs.watch
}

// TODO: GUI stuff?
