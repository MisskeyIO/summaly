import type * as Got from 'got';
/**
 * Detect HTML encoding
 * @param response Response
 * @returns encoding
 */
export declare function detectEncoding(response: Got.Response<string>): string;
export declare function toUtf8(body: Buffer, encoding: string): string;
