export default function (_s, max) {
    const s = _s?.trim() ?? '';
    if (s.length > max) {
        return `${s.substring(0, max)}...`;
    }
    else {
        return s;
    }
}
