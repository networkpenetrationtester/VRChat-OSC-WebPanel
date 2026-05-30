/* eslint-disable @typescript-eslint/no-explicit-any */

// **************************** OSC ROUTER **************************** //
export interface $VRChatOSCRouterExternalApplication {
  address: string;
  port: number;
  name?: string;
  // TODO: rules and stuff
}
// **************************** OSC ROUTER **************************** //

// **************************** PATHTOREGEXP **************************** //
export interface $PathToRegExpMatch {
  path: string;
  params: Record<string | symbol, string | string[]>;
}

export type $PathToRegExpResult = $PathToRegExpMatch | false;

export interface $PathToRegExpMatcher {
  (address: string): $PathToRegExpResult;
}
// **************************** PATHTOREGEXP **************************** //

// **************************** MESSAGELISTENER **************************** //
export interface $MessageListenerCallback<C> {
  (src: C, map: Map<string, string | string[]>, address: string, ...data: any[]): void;
}

export interface $MessageListenerPMCObject {
  pattern: string;
  matcher: $PathToRegExpMatcher;
  callback: $MessageListenerCallback<any>;
}
// **************************** MESSAGELISTENER **************************** //

// **************************** OSC INTERFACE  **************************** //
export interface $VRChatOSCInterfaceConfiguration {
  VRC_ADDRESS: string,
  VRC_RX_PORT: number,
  VRC_TX_PORT: number,
  INTERFACE_ADDRESS: string
}

export interface $VRChatOSCInterfaceAvatarTypeMap {
  inputs: Map<string, $VRChatAvatarStructureIODatatype>;
  outputs: Map<string, $VRChatAvatarStructureIODatatype>;
}

export interface $VRChatOSCInterfaceCurrentAvatar {
  data?: $VRChatAvatarData;
  structure?: $VRChatAvatarStructure;
  typemap?: $VRChatOSCInterfaceAvatarTypeMap;
}
// **************************** OSC INTERFACE  **************************** //

// **************************** AVATAR STRUCTURE **************************** //
export type $VRChatAvatarStructureIODatatype = 'Int' | 'Bool' | 'Float';

export interface $VRChatAvatarStructureIO {
  address: string;
  type: $VRChatAvatarStructureIODatatype;
}

export interface $VRChatAvatarStructureParameter {
  name: string;
  input?: $VRChatAvatarStructureIO;
  output?: $VRChatAvatarStructureIO;
  writable: boolean;
}

export interface $VRChatAvatarStructure {
  id: string;
  name: string;
  hash: number;
  parameters: $VRChatAvatarStructureParameter[];
}
// **************************** AVATAR STRUCTURE **************************** //

// **************************** AVATAR DATA **************************** //
export interface $VRChatAvatarDataParameter {
  name: string;
  value: number;
}

export interface $VRChatAvatarData {
  eyeHeight: number;
  legacyFingers: boolean;
  animationParameters: $VRChatAvatarDataParameter[];
}
// **************************** AVATAR DATA **************************** //

// **************************** VRCHAT AVATAR API **************************** //
export interface $VRChatAPICookie2FAData {
  userId: string;
  macAddress: string;
  timestamp: number;
  version: number;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
}

export type $VRChatAPIAvatarUnityPackagePerformance = 'Excellent' | 'Good' | 'Medium' | 'Poor' | 'VeryPoor';
export type $VRChatAPIAvatarUnityPackagePlatform = 'android' | 'ios' | 'standalonewindows';

export interface $VRChatAPIAvatarUnityPackageShared {
  assetVersion: number;
  created_at: string; // timestamp
  id: string;
  platform: $VRChatAPIAvatarUnityPackagePlatform;
  unityVersion: string;
}

export interface $VRChatAPIAvatarUnityPackageSecurity extends $VRChatAPIAvatarUnityPackageShared {
  performanceRating: $VRChatAPIAvatarUnityPackagePerformance;
  scanStatus: string; // passed | failed idk
  variant: 'security';
}

export interface $VRChatAPIAvatarUnityPackageImpostor extends $VRChatAPIAvatarUnityPackageShared {
  impostorizerVersion: string;
  variant: 'impostor';
}

export interface $VRChatAPIAvatarData {
  attribution: any; // idk
  authorId: string;
  authorName: string;
  created_at: string; // timestamp
  description: string;
  featured: boolean;
  id: string;
  imageUrl: string;
  listingDate: string; // timestamp ?
  name: string;
  performance: {
    'android': $VRChatAPIAvatarUnityPackagePerformance;
    'android-sort': number; // 0 | 1 ?
    'standalonewindows': $VRChatAPIAvatarUnityPackagePerformance;
    'standalonewindows-sort': number; // 0 | 1 ?
  };
  releaseStatus: string; // 'public' | 'private' ?
  searchable: boolean;
  styles: {
    primary: any; // idk
    secondary: any; // idk
  };
  tags: any[]; // idk
  thumbnailImageUrl: string;
  unityPackageUrl: string;
  unityPackageUrlObject: {}; // idk
  unityPackages: ($VRChatAPIAvatarUnityPackageSecurity | $VRChatAPIAvatarUnityPackageSecurity)[];
  updated_at: string; // timestamp
  version: number;
}
// **************************** VRCHAT AVATAR API **************************** //