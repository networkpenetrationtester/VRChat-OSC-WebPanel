interface $SIMPLE_PATH_TO_REGEXP_MATCH_SUCCESS {
    path: string
    params: { [parameter: symbol | string]: string | string[] }
}

export type $SIMPLE_PATH_TO_REGEXP_MATCH = $SIMPLE_PATH_TO_REGEXP_MATCH_SUCCESS | false; // thank GOD i could decipher this bullshit

export interface $SIMPLE_PATH_TO_REGEXP_MATCHER {
    (address: string): $SIMPLE_PATH_TO_REGEXP_MATCH;
}

export interface $MESSAGE_LISTENERS_CB<T> {
    (src: T, map: Map<string, any>, ...data: any[]): any
}

export interface $VRC_OSC_INTF_ARGS {
    SERVER_ADDRESS: string
    SERVER_PORT: number
    CLIENT_ADDRESS: string
    CLIENT_PORT: number
}

export interface $VRC_COOKIE_2FA_JWT_DATA {
    userId: string
    macAddress: string
    timestamp: number
    version: number
    iat: number
    exp: number
    aud: string
    iss: string
}

export type $VRC_AVI_STRUCTURE_IO_DATATYPE = 'Int' | 'Bool' | 'Float';

export interface $VRC_AVI_STRUCTURE_IO {
    address: string
    type: $VRC_AVI_STRUCTURE_IO_DATATYPE
}

export interface $VRC_AVI_STRUCTURE_PARAM {
    name: string
    input?: $VRC_AVI_STRUCTURE_IO
    output?: $VRC_AVI_STRUCTURE_IO
}

export interface $VRC_AVI_STRUCTURE {
    id: string
    name: string
    hash: number
    parameters: $VRC_AVI_STRUCTURE_PARAM[]
}

export interface $VRC_AVI_DATA_PARAM {
    name: string
    value: number
}

export interface $VRC_AVI_DATA {
    eyeHeight: number
    legacyFingers: boolean
    animationParameters: $VRC_AVI_DATA_PARAM[]
}

export type $VRC_AVI_API_UNIPKG_PERF = 'Excellent' | 'Good' | 'Medium' | 'Poor' | 'VeryPoor';
export type $VRC_AVI_API_UNIPKG_PLAT = 'android' | 'ios' | 'standalonewindows';

export interface $VRC_AVI_API_UNIPKG_SHARED {
    'assetVersion': number
    'created_at': string // timestamp
    'id': string
    'platform': $VRC_AVI_API_UNIPKG_PLAT
    'unityVersion': string
}

export interface $VRC_AVI_API_UNIPKG_SECURITY extends $VRC_AVI_API_UNIPKG_SHARED {
    'performanceRating': $VRC_AVI_API_UNIPKG_PERF
    'scanStatus': string // passed | failed idk
    'variant': 'security'
}

export interface $VRC_AVI_API_UNIPKG_IMPOSTOR extends $VRC_AVI_API_UNIPKG_SHARED {
    'impostorizerVersion': string
    'variant': 'impostor'
}

export interface $VRC_AVI_API_DATA {
    'attribution': any // idk
    'authorId': string
    'authorName': string
    'created_at': string // timestamp
    'description': string
    'featured': boolean
    'id': string
    'imageUrl': string
    'listingDate': string // timestamp ?
    'name': string
    'performance': {
        'android': $VRC_AVI_API_UNIPKG_PERF
        'android-sort': number // 0 | 1 ?
        'standalonewindows': $VRC_AVI_API_UNIPKG_PERF
        'standalonewindows-sort': number // 0 | 1 ?
    }
    'releaseStatus': string // 'public' | 'private' ?
    'searchable': boolean
    'styles': {
        'primary': any // idk
        'secondary': any // idk
    }
    'tags': any[] // idk
    'thumbnailImageUrl': string
    'unityPackageUrl': string
    'unityPackageUrlObject': {} // idk
    'unityPackages': ($VRC_AVI_API_UNIPKG_IMPOSTOR | $VRC_AVI_API_UNIPKG_SECURITY)[]
    'updated_at': string // timestamp
    'version': number
}