import { type GeneralScrapingOptions, parseGeneral } from '@/general.js';
import type Summary from '@/summary.js';
import { getGotOptions, getResponse } from '@/utils/got.js';
import * as cheerio from 'cheerio';

export function test(url: URL): boolean {
  return url.hostname === 'bsky.app';
}

export async function summarize(url: URL, opts?: GeneralScrapingOptions): Promise<Summary | null> {
  const args = getGotOptions(url.href, opts);

  // HEADで取ると404が返るためGETのみで取得
  const res = await getResponse({
    ...args,
    method: 'GET',
  });
  const body = res.body;
  const $ = cheerio.load(body);

  return await parseGeneral(url, {
    body,
    $,
    response: res,
  });
}
