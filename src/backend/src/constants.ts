import fs from 'fs';
import os from 'os';
import path from 'path';
import { env } from 'process';
import chalk from 'chalk';
import { config } from 'dotenv';

// **************************** ENVIRONMENT **************************** //
export function GetProjectRoot(start_cwd: string) {
	if (fs.existsSync(path.join(start_cwd, 'package.json'))) return start_cwd;
	for (
		let prev_cwd = start_cwd, curr_cwd = path.dirname(start_cwd);
		curr_cwd != prev_cwd;
		prev_cwd = curr_cwd, curr_cwd = path.dirname(curr_cwd)
	) {
		if (fs.existsSync(path.join(curr_cwd, 'package.json'))) return curr_cwd;
	}
	return undefined;
}

const cwd = import.meta.dirname; // process.cwd(); for an .env inside the root of another project
const root = GetProjectRoot(cwd);

console.log(
	typeof root === 'string'
		? chalk.bgGreen(`[constants.ts] Found project root '${root}'.`)
		: chalk.bgYellow(`[constants.ts] Failed to recursively find project root of '${cwd}'.`)
);

export const PROJECT_ROOT = root ?? path.dirname(import.meta.dirname);

config({ path: path.join(PROJECT_ROOT, '.env'), quiet: false });

export const VRC_ADDRESS = env.vrchat_address ?? 'localhost';
export const VRC_RX_PORT = Number(env.vrchat_recieve_port ?? '9000'); // VRC <- INTF
export const VRC_TX_PORT = Number(env.vrchat_transmit_port ?? '9001'); // VRC -> INTF
export const INTERFACE_ADDRESS = env.interface_address ?? 'localhost';
export const LOGGING = env.logging === 'true';
export const VERBOSE = env.logging === 'true' && env.verbose === 'true';
// **************************** ENVIRONMENT **************************** //

// **************************** DIRECTORIES **************************** //
export const HOME_DIR = os.homedir();
export const VRC_DIR = path.join(HOME_DIR, 'AppData', 'LocalLow', 'VRChat', 'VRChat'); // TODO: determine OS platform and corresponding DIRs automatically
// **************************** DIRECTORIES **************************** //

// **************************** ARCHIVED WIZARDRY **************************** //
//      // NOTE: THIS METHOD >> DOES NOT WORK << WHEN THE USER IS SIGNED INTO A STEAM ACCOUNT... BUT WOULD YOU EVEN BE ABLE TO GET AN AUTHTOKEN WITH THAT ANYWAY?
//      // NOTE: THIS METHOD >> DOES NOT WORK << WHEN THE USER DOESN'T HAVE 2FA :sob: EVEN IF THE USER USES 2FA SOMETIMES THE CLIENT DOESN'T PROMPT FOR 2FA AND THERE'S NO TOKEN FUCK
//      const VRC_CLIENT_COOKIE_BINARY = fs.readFileSync(path.join(VRC_DIR, 'Cookies', 'Library'), 'binary');
//      const VRC_CLIENT_COOKIE_AUTH = VRC_CLIENT_COOKIE_BINARY.match(/(?<=auth\/)authcookie_[a0-f9-]+/)?.[0];
//      if (!VRC_CLIENT_COOKIE_AUTH) throw new Error(`could not find auth value in client Library cookie`);
//      const VRC_CLIENT_COOKIE_2FA = VRC_CLIENT_COOKIE_BINARY.match(/(?<=twoFactorAuth.\x02)[aA0-zZ9.-=]+/)?.[0];
//      if (!VRC_CLIENT_COOKIE_2FA) throw new Error(`could not find twoFactorAuth value in client Library cookie`);
//      const VRC_CLIENT_COOKIE_2FA_DATA: $VRC_COOKIE_2FA_JWT_DATA = JSON.parse(atob(VRC_CLIENT_COOKIE_2FA.split('.')[1] ?? btoa('{}')));
//      const VRC_CLIENT_USER_ID = VRC_CLIENT_COOKIE_2FA_DATA.userId;
// **************************** ARCHIVED WIZARDRY **************************** //

// **************************** USED ONLY TO FIND CURRENT USER ID SIGNED INTO THE GAME **************************** //
export const VRC_USER_ID = env.vrchat_user_id;
if (!VRC_USER_ID) throw new Error(chalk.bgRed(`[constants.ts] Value 'vrchat_user_id' not specified in .env`));

export const VRC_AVI_STRUCTURE_DIR = path.join(VRC_DIR, 'OSC', VRC_USER_ID, 'Avatars'); // OSC for typemaps
if (!fs.existsSync(VRC_AVI_STRUCTURE_DIR))
	throw new Error(chalk.bgRed(`[constants.ts] Directory ${VRC_AVI_STRUCTURE_DIR} does not exist.`));

export const VRC_AVI_DATA_DIR = path.join(VRC_DIR, 'LocalAvatarData', VRC_USER_ID); // LocalAvatarData for actual values
if (!fs.existsSync(VRC_AVI_DATA_DIR))
	throw new Error(chalk.bgRed(`[constants.ts] Directory ${VRC_AVI_DATA_DIR} does not exist.`));
// **************************** USED ONLY TO FIND CURRENT USER ID SIGNED INTO THE GAME **************************** //

// **************************** USED ONLY TO PERFORM STATELESS API REQUESTS **************************** //
export const VRC_API_COOKIE_AUTH = env.vrchat_cookie_auth;
if (!VRC_API_COOKIE_AUTH)
	console.log(
		chalk.bgYellow(`[constants.ts] Value 'vrchat_cookie_auth' not specified in .env (Disabling API features)`)
	);

export const VRC_API_COOKIE_2FA = env.vrchat_cookie_twoFactorAuth;
if (!VRC_API_COOKIE_2FA)
	console.log(
		chalk.bgYellow(
			`[constants.ts] Value 'vrchat_cookie_twoFactorAuth' not specified in .env (May cause API authentication failure)`
		)
	);

export const USE_API_FEATURES = VRC_API_COOKIE_AUTH != null && env.use_api_features === 'true';

export const VRC_API_COOKIE = { auth: VRC_API_COOKIE_AUTH, twoFactorAuth: VRC_API_COOKIE_2FA };
// **************************** USED ONLY TO PERFORM STATELESS API REQUESTS **************************** //
