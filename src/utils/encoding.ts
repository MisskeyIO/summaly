import iconv from 'iconv-lite';
import * as Got from 'got';

const regCharset = new RegExp(/charset\s*=\s*["']?([\w-]+)/, 'i');

/**
 * Detect HTML encoding
 * @param response Response
 * @returns encoding
 */
export function detectEncoding(response: Got.Response<string>): string {
	const matchContentType = response.headers['content-type']?.match(regCharset);
	if (matchContentType) {
		const candicate = matchContentType[1];
		const encoding = toEncoding(candicate);
		if (encoding != null) return encoding;
	}

	// From meta
	const matchMeta = response.rawBody.toString('ascii').match(regCharset);
	if (matchMeta) {
		const candicate = matchMeta[1];
		const encoding = toEncoding(candicate);
		if (encoding != null) return encoding;
	}

	return 'utf-8';
}

export function toUtf8(body: Buffer, encoding: string): string {
	return iconv.decode(body, encoding);
}

function toEncoding(candicate: string): string | null {
	if (iconv.encodingExists(candicate)) {
		if (['shift_jis', 'shift-jis', 'windows-31j', 'x-sjis'].includes(candicate.toLowerCase())) return 'cp932';
		return candicate;
	} else {
		return null;
	}
}
