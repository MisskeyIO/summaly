import type { URL } from 'node:url';
import { StatusError } from '@/utils/status-error.js';
export declare class StatusRedirect extends StatusError {
    name: string;
    location?: string;
    constructor(message: string, requestUrl: URL, statusCode: number, statusMessage: string, location?: string);
}
//# sourceMappingURL=status-redirect.d.ts.map