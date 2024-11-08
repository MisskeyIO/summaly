import type { URL } from 'node:url';
import type { GeneralScrapingOptions } from '@/general.js';
import type Summary from './summary.js';
export interface SummalyPlugin {
    test: (url: URL) => boolean;
    summarize: (url: URL, opts?: GeneralScrapingOptions) => Promise<Summary | null>;
}
