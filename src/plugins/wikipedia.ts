import type { URL } from 'node:url';
import { get } from '@/utils/got.js';
import type summary from '../summary.js';
import clip from './../utils/clip.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const log = (_: string): void => {
  return;
};

export function test(url: URL): boolean {
  if (!url.hostname) return false;
  return url.hostname.endsWith('.wikipedia.org');
}

export async function summarize(url: URL): Promise<summary> {
  const lang = url.host ? url.host.split('.')[0] : null;
  const title = url.pathname ? url.pathname.split('/')[2] : null;
  const endpoint = `https://${lang}.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=${title}`;

  log(`lang is ${lang}`);
  log(`title is ${title}`);
  log(`endpoint is ${endpoint}`);

  const body = JSON.parse(await get(endpoint));
  log(body);

  if (!('query' in body) || !('pages' in body.query)) {
    throw new Error('fetch failed');
  }

  const info = body.query.pages[Object.keys(body.query.pages)[0]];

  return {
    title: info.title,
    icon: 'https://wikipedia.org/static/favicon/wikipedia.ico',
    description: clip(info.extract, 300),
    thumbnail: `https://wikipedia.org/static/images/project-logos/${lang}wiki.png`,
    player: {
      url: null,
      width: null,
      height: null,
      allow: [],
    },
    sitename: 'Wikipedia',
    activityPub: null,
  };
}
