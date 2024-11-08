/* eslint-disable no-param-reassign */
import escapeRegExp from 'escape-regexp';

export default function (_title: string, _siteName?: string | null): string {
  const title = _title.trim();

  if (_siteName) {
    const siteName = _siteName.trim();

    const x = escapeRegExp(siteName);

    const patterns = [`^(.+?)\\s?[\\-\\|:・]\\s?${x}$`];

    for (const element of patterns) {
      const pattern = new RegExp(element);
      const [, match] = pattern.exec(title) ?? [null, null];
      if (match) {
        return match;
      }
    }
  }

  return title;
}
