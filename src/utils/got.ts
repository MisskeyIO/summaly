import { readFileSync } from 'node:fs';
import { STATUS_CODES } from 'node:http';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { GeneralScrapingOptions } from '@/general.js';
import lookupAddresses from '@/utils/dns.js';
import { StatusRedirect } from '@/utils/status-redirect.js';
import * as cheerio from 'cheerio';
import got, * as Got from 'got';
import PrivateIp from 'private-ip';
import { detectEncoding, toUtf8 } from './encoding.js';
import { StatusError } from './status-error.js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

export let agent: Got.Agents = {};

export function setAgent(_agent: Got.Agents) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  agent = _agent || {};
}

export type GotOptions = {
  url: string;
  method: 'GET' | 'POST' | 'HEAD';
  body?: string;
  headers: Record<string, string | undefined>;
  typeFilter?: RegExp;
  maxRedirects?: number;
  responseTimeout?: number;
  operationTimeout?: number;
  contentLengthLimit?: number;
  contentLengthRequired?: boolean;
};

const repo = JSON.parse(readFileSync(`${_dirname}/../../package.json`, 'utf8'));

export const DEFAULT_RESPONSE_TIMEOUT = 20 * 1000;
export const DEFAULT_OPERATION_TIMEOUT = 60 * 1000;
export const DEFAULT_MAX_RESPONSE_SIZE = 10 * 1024 * 1024;
export const DEFAULT_BOT_UA = `Mozilla/5.0 (compatible; SummalyBot/${repo.version})`;

export function getGotOptions(url: string, opts?: GeneralScrapingOptions): Omit<GotOptions, 'method'> {
  return {
    url,
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': opts?.userAgent ?? DEFAULT_BOT_UA,
      'accept-language': opts?.lang ?? undefined,
    },
    typeFilter: /^(text\/html|application\/xhtml\+xml)/,
    maxRedirects: opts?.maxRedirects ?? 3,
    responseTimeout: opts?.responseTimeout,
    operationTimeout: opts?.operationTimeout,
    contentLengthLimit: opts?.contentLengthLimit,
    contentLengthRequired: opts?.contentLengthRequired,
  };
}

export async function scpaping(url: string, opts?: GeneralScrapingOptions) {
  const args = getGotOptions(url, opts);

  const response = await getResponse({
    ...args,
    method: 'GET',
  });

  const encoding = detectEncoding(response);
  const body = toUtf8(response.rawBody, encoding);
  const $ = cheerio.load(body);

  return {
    body,
    $,
    response,
  };
}

export async function get(url: string) {
  const res = await getResponse({
    url,
    method: 'GET',
    headers: {
      accept: '*/*',
    },
  });

  return res.body;
}

export async function head(url: string) {
  return await getResponse({
    url,
    method: 'HEAD',
    headers: {
      accept: '*/*',
    },
  });
}

export async function getResponse(args: GotOptions) {
  const timeout = args.responseTimeout ?? DEFAULT_RESPONSE_TIMEOUT;
  const operationTimeout = args.operationTimeout ?? DEFAULT_OPERATION_TIMEOUT;

  const targetUrl = new URL(args.url);
  const addresses = await lookupAddresses(targetUrl.hostname);

  // SUMMALY_ALLOW_PRIVATE_IPはテスト用
  const allowPrivateIp = process.env.SUMMALY_ALLOW_PRIVATE_IP === 'true' || Object.keys(agent).length > 0;

  // プライベートIPを許可しない場合、プライベートIPにアクセスできる可能性がある場合はリクエストを拒否
  if (!allowPrivateIp && addresses.some(addr => PrivateIp(addr))) {
    console.warn(`Access to Private Networks is not allowed: ${targetUrl.host}`);
    throw new StatusError(
      'Preview not available: Access to Private Networks is not allowed',
      targetUrl,
      403,
      'Forbidden',
    );
  }

  const req = got<string>(args.url, {
    method: args.method,
    headers: args.headers,
    body: args.body,
    timeout: {
      lookup: timeout,
      connect: timeout,
      secureConnect: timeout,
      socket: timeout, // read timeout
      response: timeout,
      send: timeout,
      request: operationTimeout, // whole operation timeout
    },
    followRedirect: (args.maxRedirects ?? 3) > 0,
    maxRedirects: args.maxRedirects ?? 3,
    agent,
    http2: false,
    retry: {
      limit: 0,
    },
  });

  const res = await receiveResponse({ req, opts: args });

  // プライベートIPを許可しない場合、応答がプライベートIPの場合は表示を拒否
  if (!allowPrivateIp && res.ip && PrivateIp(res.ip)) {
    console.warn(`Access to Private Networks is not allowed: ${targetUrl.host}(${res.ip})`);
    throw new StatusError(
      'Preview not available: Access to Private Networks is not allowed',
      targetUrl,
      403,
      'Forbidden',
    );
  }

  // Check status code
  if (res.statusCode < 200 || res.statusCode >= 400) {
    throw new StatusError(
      `Preview not available: HTTP ${res.statusCode} ${res.statusMessage ?? STATUS_CODES[res.statusCode] ?? 'Unknown'}`,
      targetUrl,
      res.statusCode,
      res.statusMessage ?? STATUS_CODES[res.statusCode] ?? 'Unknown',
    );
  } else if (res.statusCode >= 300) {
    const location = res.headers.location;
    if (location) {
      const locationUrl = new URL(location, args.url);
      throw new StatusRedirect(
        `Preview not available: Page redirected to ${locationUrl.href}`,
        targetUrl,
        res.statusCode,
        res.statusMessage ?? STATUS_CODES[res.statusCode] ?? 'Unknown',
        locationUrl.href,
      );
    } else {
      throw new StatusError(
        `Preview not available: HTTP ${res.statusCode} ${res.statusMessage ?? STATUS_CODES[res.statusCode] ?? 'Unknown'}`,
        targetUrl,
        res.statusCode,
        res.statusMessage ?? STATUS_CODES[res.statusCode] ?? 'Unknown',
      );
    }
  }

  // Check html
  const contentType = res.headers['content-type'];
  if (args.typeFilter && !contentType?.match(args.typeFilter)) {
    throw new Error(`Rejected by type filter ${contentType}`);
  }

  // 応答ヘッダでサイズチェック
  const contentLength = res.headers['content-length'];
  if (contentLength) {
    const maxSize = args.contentLengthLimit ?? DEFAULT_MAX_RESPONSE_SIZE;
    const size = Number(contentLength);
    if (size > maxSize) {
      throw new Error(`maxSize exceeded (${size} > ${maxSize}) on response`);
    }
  } else if (args.contentLengthRequired) {
    throw new Error('content-length required');
  }

  return res;
}

async function receiveResponse<T>(args: {
  req: Got.CancelableRequest<Got.Response<T>>;
  opts: GotOptions;
}) {
  const req = args.req;
  const maxSize = args.opts.contentLengthLimit ?? DEFAULT_MAX_RESPONSE_SIZE;

  // 受信中のデータでサイズチェック
  req.on('downloadProgress', (progress: Got.Progress) => {
    if (progress.transferred > maxSize && progress.percent !== 1) {
      req.cancel(`maxSize exceeded (${progress.transferred} > ${maxSize}) on response`);
    }
  });

  // 応答取得 with ステータスコードエラーの整形
  return await req.catch(e => {
    if (e instanceof Got.HTTPError) {
      throw new StatusError(
        `Preview not available: HTTP ${e.response.statusCode} ${e.response.statusMessage ?? STATUS_CODES[e.response.statusCode] ?? 'Unknown'}`,
        e.response.requestUrl,
        e.response.statusCode,
        e.response.statusMessage ?? STATUS_CODES[e.response.statusCode] ?? 'Unknown',
      );
    } else {
      throw e;
    }
  });
}
