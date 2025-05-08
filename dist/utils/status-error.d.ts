import type { URL } from 'node:url';
export declare class StatusError extends Error {
    name: string;
    requestUrl: URL;
    statusCode: number;
    statusMessage: string;
    isPermanentError: boolean;
    constructor(message: string, requestUrl: URL, statusCode: number, statusMessage: string);
}
//# sourceMappingURL=status-error.d.ts.map