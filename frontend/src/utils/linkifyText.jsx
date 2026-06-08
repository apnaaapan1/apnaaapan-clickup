import { Fragment } from 'react';

const URL_REGEX = /(https?:\/\/[^\s<>,]+|www\.[^\s<>,]+)/gi;
const URL_TEST = /^(https?:\/\/|www\.)/i;

function normalizeHref(url) {
  return url.startsWith('www.') ? `https://${url}` : url;
}

function trimTrailingPunctuation(url) {
  return url.replace(/[.,;:!?)]+$/, '');
}

export function linkifyText(text) {
  if (!text) return null;

  const parts = text.split(URL_REGEX);

  return parts.map((part, index) => {
    if (!part) return null;

    if (URL_TEST.test(part)) {
      const display = trimTrailingPunctuation(part);
      const href = normalizeHref(display);

      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {display}
        </a>
      );
    }

    return <Fragment key={index}>{part}</Fragment>;
  });
}
