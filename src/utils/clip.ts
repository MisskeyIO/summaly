export default function (_s: string | null | undefined, max: number): string {
  const s = _s?.trim() ?? '';

  if (s.length > max) {
    return `${s.substring(0, max)}...`;
  } else {
    return s;
  }
}
