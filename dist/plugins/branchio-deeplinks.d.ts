import type { URL } from 'node:url';
import { type GeneralScrapingOptions } from '../general.js';
import type Summary from '../summary.js';
export declare function test(url: URL): boolean;
export declare function summarize(url: URL, opts?: GeneralScrapingOptions): Promise<Summary | null>;
