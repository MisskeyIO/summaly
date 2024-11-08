import iconv from 'iconv-lite';
const regCharset = new RegExp(/charset\s*=\s*["']?([\w-]+)/, 'i');
/**
 * Detect HTML encoding
 * @param response Response
 * @returns encoding
 */
export function detectEncoding(response) {
    const matchContentType = response.headers['content-type']?.match(regCharset);
    if (matchContentType) {
        const candidate = matchContentType[1];
        const encoding = toEncoding(candidate);
        if (encoding != null)
            return encoding;
    }
    // From meta
    const matchMeta = response.rawBody.toString('ascii').match(regCharset);
    if (matchMeta) {
        const candidate = matchMeta[1];
        const encoding = toEncoding(candidate);
        if (encoding != null)
            return encoding;
    }
    return 'utf-8';
}
export function toUtf8(body, encoding) {
    return iconv.decode(body, encoding);
}
function toEncoding(candidate) {
    if (iconv.encodingExists(candidate)) {
        if (['shift_jis', 'shift-jis', 'windows-31j', 'x-sjis'].includes(candidate.toLowerCase()))
            return 'cp932';
        return candidate;
    }
    else {
        return null;
    }
}
