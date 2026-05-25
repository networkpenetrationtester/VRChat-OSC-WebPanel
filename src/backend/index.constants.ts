import { config } from 'dotenv';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { env } from 'node:process';

config({ path: path.join(import.meta.dirname, '.env'), quiet: true }); // make other projects use the .env file from this project's directory

export const SERVER_ADDRESS = env.server_address ?? 'localhost';
export const SERVER_PORT = Number(env.server_port ?? '9001');

export const CLIENT_ADDRESS = env.client_address ?? 'localhost';
export const CLIENT_PORT = Number(env.client_port ?? '9000');

const HOME_DIR = os.homedir();
const VRC_DIR = path.join(HOME_DIR, 'AppData', 'LocalLow', 'VRChat', 'VRChat'); // TODO: determine OS platform and corresponding DIRs automatically



// **************************** USED ONLY TO FIND CURRENT USER ID SIGNED INTO THE GAME **************************** //
// NOTE: THIS METHOD >> DOES NOT WORK << WHEN THE USER IS SIGNED INTO A STEAM ACCOUNT... BUT WOULD YOU EVEN BE ABLE TO GET AN AUTHTOKEN WITH THAT ANYWAY?
// NOTE: THIS METHOD >> DOES NOT WORK << WHEN THE USER DOESN'T HAVE 2FA :sob: EVEN IF THE USER USES 2FA SOMETIMES THE CLIENT DOESN'T PROMPT FOR 2FA AND THERE'S NO TOKEN FUCK

// const VRC_CLIENT_COOKIE_BINARY = fs.readFileSync(path.join(VRC_DIR, 'Cookies', 'Library'), 'binary');

// const VRC_CLIENT_COOKIE_AUTH = VRC_CLIENT_COOKIE_BINARY.match(/(?<=auth\/)authcookie_[a0-f9-]+/)?.[0];
// if (!VRC_CLIENT_COOKIE_AUTH) throw new Error(`could not find auth value in client Library cookie`);

// const VRC_CLIENT_COOKIE_2FA = VRC_CLIENT_COOKIE_BINARY.match(/(?<=twoFactorAuth.\x02)[aA0-zZ9.-=]+/)?.[0];
// if (!VRC_CLIENT_COOKIE_2FA) throw new Error(`could not find twoFactorAuth value in client Library cookie`);

// const VRC_CLIENT_COOKIE_2FA_DATA: $VRC_COOKIE_2FA_JWT_DATA = JSON.parse(atob(VRC_CLIENT_COOKIE_2FA.split('.')[1] ?? btoa('{}')));

// const VRC_CLIENT_USER_ID = VRC_CLIENT_COOKIE_2FA_DATA.userId;

export const VRC_USER_ID = env.vrchat_user_id;
if (!VRC_USER_ID) throw new Error(`user id not specified in .env`);

export const VRC_AVI_STRUCTURE_DIR = path.join(VRC_DIR, 'OSC', VRC_USER_ID, 'Avatars'); // OSC for typemaps
if (!fs.existsSync(VRC_AVI_STRUCTURE_DIR)) throw new Error(`directory does not exist ${VRC_AVI_STRUCTURE_DIR}`);

export const VRC_AVI_DATA_DIR = path.join(VRC_DIR, 'LocalAvatarData', VRC_USER_ID); // LocalAvatarData for actual values
if (!fs.existsSync(VRC_AVI_DATA_DIR)) throw new Error(`directory does not exist ${VRC_AVI_DATA_DIR}`);

// **************************** USED ONLY TO FIND CURRENT USER ID SIGNED INTO THE GAME **************************** //






// **************************** USED ONLY TO PERFORM STATELESS API REQUESTS **************************** //

const VRC_API_COOKIE_AUTH = env.vrchat_cookie_auth;
if (!VRC_API_COOKIE_AUTH) console.error(`API auth not specified in .env (disabling api features)`);

const VRC_API_COOKIE_2FA = env.vrchat_cookie_twoFactorAuth;
if (!VRC_API_COOKIE_2FA) console.error(`API twoFactorAuth not specified in .env (may disable api features)`);

export const USE_API_FEATURES = VRC_API_COOKIE_AUTH != null && env.use_api_features === 'true';

export const VRC_API_COOKIE = { auth: VRC_API_COOKIE_AUTH, twoFactorAuth: VRC_API_COOKIE_2FA };

// **************************** USED ONLY TO PERFORM STATELESS API REQUESTS **************************** //