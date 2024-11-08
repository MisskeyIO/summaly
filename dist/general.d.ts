import { URL } from 'node:url';
import type { default as Summary } from './summary.js';
export type GeneralScrapingOptions = {
    lang?: string | null;
    userAgent?: string;
    responseTimeout?: number;
    operationTimeout?: number;
    contentLengthLimit?: number;
    contentLengthRequired?: boolean;
};
declare const _default: (_url: URL | string, opts?: GeneralScrapingOptions) => Promise<Summary | null>;
export default _default;
