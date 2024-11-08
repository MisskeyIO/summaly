/**
 * summaly
 * https://github.com/misskey-dev/summaly
 */
import type { FastifyInstance } from 'fastify';
import type * as Got from 'got';
import type { SummalyPlugin } from './iplugin.js';
import type { SummalyResult } from './summary.js';
export * from './iplugin.js';
export type SummalyOptions = {
    /**
     * Accept-Language for the request
     */
    lang?: string | null;
    /**
     * Whether follow redirects
     */
    followRedirects?: boolean;
    /**
     * Custom Plugins
     */
    plugins?: SummalyPlugin[];
    /**
     * Custom HTTP agent
     */
    agent?: Got.Agents;
    /**
     * User-Agent for the request
     */
    userAgent?: string;
    /**
     * Response timeout.
     * Set timeouts for each phase, such as host name resolution and socket communication.
     */
    responseTimeout?: number;
    /**
     * Operation timeout.
     * Set the timeout from the start to the end of the request.
     */
    operationTimeout?: number;
    /**
     * Maximum content length.
     * If set to true, an error will occur if the content-length value returned from the other server is larger than this parameter (or if the received body size exceeds this parameter).
     */
    contentLengthLimit?: number;
    /**
     * Content length required.
     * If set to true, it will be an error if the other server does not return content-length.
     */
    contentLengthRequired?: boolean;
};
export declare const summalyDefaultOptions: SummalyOptions;
/**
 * Summarize an web page
 */
export declare const summaly: (url: string, options?: SummalyOptions) => Promise<SummalyResult>;
export default function (fastify: FastifyInstance, options: SummalyOptions, done: (err?: Error) => void): void;
