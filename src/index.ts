/**
 * summaly
 * https://github.com/misskey-dev/summaly
 */

import { EventEmitter } from 'node:events';
import { URL } from 'node:url';
import lookupAddresses from '@/utils/dns.js';
import { StatusError } from '@/utils/status-error.js';
import { StatusRedirect } from '@/utils/status-redirect.js';
import type { FastifyInstance } from 'fastify';
import type * as Got from 'got';
import { got } from 'got';
import PrivateIp from 'private-ip';
import { type GeneralScrapingOptions, general } from './general.js';
import type { SummalyPlugin } from './iplugin.js';
import { plugins as builtinPlugins } from './plugins/_.js';
import type { SummalyResult } from './summary.js';
import { DEFAULT_OPERATION_TIMEOUT, DEFAULT_RESPONSE_TIMEOUT, agent, setAgent } from './utils/got.js';

EventEmitter.defaultMaxListeners = 25;

export * from './iplugin.js';

export type SummalyOptions = {
  /**
   * Accept-Language for the request
   */
  lang?: string | null;

  /**
   * If exceeded, the request will be aborted, 0 means redirects are not followed.
   */
  maxRedirects?: number;

  /**
   * Whether follow redirects
   * @deprecated Use `maxRedirects` instead.
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

export const summalyDefaultOptions = {
  lang: null,
  maxRedirects: 3,
  plugins: [],
} as SummalyOptions;

/**
 * Summarize an web page
 */
export const summaly = async (url: string, options?: SummalyOptions): Promise<SummalyResult> => {
  if (options?.agent) setAgent(options.agent);

  const opts = { ...summalyDefaultOptions, ...options };
  // noinspection JSDeprecatedSymbols
  if (opts.followRedirects === false) {
    opts.maxRedirects = 0;
  }

  const plugins = builtinPlugins.concat(opts.plugins || []);

  const requestUrl = new URL(url);
  const addresses = await lookupAddresses(requestUrl.hostname);

  // SUMMALY_ALLOW_PRIVATE_IPはテスト用
  const allowPrivateIp = process.env.SUMMALY_ALLOW_PRIVATE_IP === 'true' || Object.keys(agent).length > 0;

  // プライベートIPを許可しない場合、プライベートIPにアクセスできる可能性がある場合はリクエストを拒否
  if (!allowPrivateIp && addresses.some(addr => PrivateIp(addr))) {
    console.warn(`Access to Private Networks is not allowed: ${requestUrl.host}`);
    throw new StatusError('Access to Private Networks is not allowed', requestUrl, 403, 'Forbidden');
  }

  let actualUrl = url;
  try {
    const timeout = opts.responseTimeout ?? DEFAULT_RESPONSE_TIMEOUT;
    const operationTimeout = opts.operationTimeout ?? DEFAULT_OPERATION_TIMEOUT;
    actualUrl = await got
      .head(url, {
        timeout: {
          lookup: timeout,
          connect: timeout,
          secureConnect: timeout,
          socket: timeout, // read timeout
          response: timeout,
          send: timeout,
          request: operationTimeout, // whole operation timeout
        },
        followRedirect: (opts.maxRedirects ?? 3) > 0,
        maxRedirects: opts.maxRedirects ?? 3,
        agent,
        http2: false,
        retry: {
          limit: 0,
        },
      })
      .then(res => res.url);

    if (url !== actualUrl) {
      // リダイレクト先のURLを取得できたので、これ以上リダイレクトを追わないように
      opts.followRedirects = false;
      opts.maxRedirects = 0;
    }
  } catch {}

  const _url = new URL(actualUrl);

  // Find matching plugin
  const match = plugins.filter(plugin => plugin.test(_url))[0];

  // Get summary
  const scrapingOptions: GeneralScrapingOptions = {
    lang: opts.lang,
    userAgent: opts.userAgent,
    maxRedirects: opts.maxRedirects,
    responseTimeout: opts.responseTimeout,
    operationTimeout: opts.operationTimeout,
    contentLengthLimit: opts.contentLengthLimit,
    contentLengthRequired: opts.contentLengthRequired,
  };

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const summary = await (match ? match.summarize : general)(_url, scrapingOptions);

  if (summary == null) {
    throw new Error(`Preview not available: Unable to summarize ${actualUrl}`);
  }

  return Object.assign(summary, {
    url: actualUrl,
  });
};

// noinspection JSUnusedGlobalSymbols
export default function (fastify: FastifyInstance, options: SummalyOptions, done: (err?: Error) => void) {
  fastify.get<{
    Querystring: {
      url?: string;
      lang?: string;
    };
  }>('/', async (req, reply) => {
    const url = req.query.url as string;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (url == null) {
      return reply.status(400).send({
        error: 'url is required',
      });
    }

    try {
      return await summaly(url, {
        lang: req.query.lang as string,
        ...options,
      });
    } catch (e) {
      if (e instanceof StatusRedirect) {
        return reply.status(200).send(<SummalyResult>{
          title: e.message,
          icon: null,
          description: null,
          thumbnail: null,
          player: {
            url: null,
            width: null,
            height: null,
            allow: ['autoplay', 'encrypted-media', 'fullscreen'],
          },
          sitename: e.requestUrl.host,
          sensitive: false,
          url: e.location ?? e.requestUrl.href,
          activityPub: null,
          fediverseCreator: null,
        });
      } else if (e instanceof StatusError) {
        return reply.status(200).send(<SummalyResult>{
          title: e.message,
          icon: null,
          description: null,
          thumbnail: null,
          player: {
            url: null,
            width: null,
            height: null,
            allow: ['autoplay', 'encrypted-media', 'fullscreen'],
          },
          sitename: e.requestUrl.host,
          sensitive: false,
          url: e.requestUrl.href,
          activityPub: null,
          fediverseCreator: null,
        });
      } else {
        return reply.status(500).send({
          error: e,
        });
      }
    }
  });

  done();
}
