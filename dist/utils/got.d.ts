import * as cheerio from 'cheerio';
import * as Got from 'got';
export declare let agent: Got.Agents;
export declare function setAgent(_agent: Got.Agents): void;
export type GotOptions = {
    url: string;
    method: 'GET' | 'POST' | 'HEAD';
    body?: string;
    headers: Record<string, string | undefined>;
    typeFilter?: RegExp;
    responseTimeout?: number;
    operationTimeout?: number;
    contentLengthLimit?: number;
    contentLengthRequired?: boolean;
};
export declare const DEFAULT_RESPONSE_TIMEOUT: number;
export declare const DEFAULT_OPERATION_TIMEOUT: number;
export declare const DEFAULT_MAX_RESPONSE_SIZE: number;
export declare const DEFAULT_BOT_UA: string;
export declare function scpaping(url: string, opts?: {
    lang?: string;
    userAgent?: string;
    responseTimeout?: number;
    operationTimeout?: number;
    contentLengthLimit?: number;
    contentLengthRequired?: boolean;
}): Promise<{
    body: string;
    $: cheerio.CheerioAPI;
    response: Got.Response<string>;
}>;
export declare function get(url: string): Promise<string>;
export declare function head(url: string): Promise<Got.Response<string>>;
//# sourceMappingURL=got.d.ts.map