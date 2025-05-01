import { URL } from 'node:url';
import type { default as Summary } from './summary.js';
import { scpaping } from './utils/got.js';
export type GeneralScrapingOptions = {
    lang?: string | null;
    userAgent?: string;
    followRedirects?: boolean;
    responseTimeout?: number;
    operationTimeout?: number;
    contentLengthLimit?: number;
    contentLengthRequired?: boolean;
};
export declare function general(_url: URL | string, opts?: GeneralScrapingOptions): Promise<Summary | null>;
export declare function parseGeneral(_url: URL | string, res: Awaited<ReturnType<typeof scpaping>>): Promise<Summary | null>;
//# sourceMappingURL=general.d.ts.map