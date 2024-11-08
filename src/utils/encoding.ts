import type * as Got from 'got';
import iconv from 'iconv-lite';

const regCharset = new RegExp(/charset\s*=\s*["']?([\w-]+)/, 'i');

/**
 * Detect HTML encoding
 * @param response Response
 * @returns encoding
 */
export function detectEncoding(response: Got.Response<string>): string {
  const matchContentType = response.headers['content-type']?.match(regCharset);
  if (matchContentType) {
    const candidate = matchContentType[1];
    const encoding = toEncoding(candidate);
    if (encoding != null) return encoding;
  }

  // From meta
  const matchMeta = response.rawBody.toString('ascii').match(regCharset);
  if (matchMeta) {
    const candidate = matchMeta[1];
    const encoding = toEncoding(candidate);
    if (encoding != null) return encoding;
  }

  return 'utf-8';
}

export function toUtf8(body: Buffer, encoding: string): string {
  return iconv.decode(body, encoding);
}

function toEncoding(candidate: string): string | null {
  if (iconv.encodingExists(candidate)) {
    if (['shift_jis', 'shift-jis', 'windows-31j', 'x-sjis'].includes(candidate.toLowerCase())) return 'cp932';
    return candidate;
  } else {
    return null;
  }
}
