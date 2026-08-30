import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Wraps every statically rendered route. This runs in Node during `expo export`,
 * so nothing in here can touch the DOM.
 *
 * Per-route title, description and canonical live in `SeoHead` instead — the
 * static export emits a helmet-managed <title> ahead of anything declared here.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Disables body scrolling on web, so <ScrollView> components scroll instead. */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: rootStyle }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const rootStyle = `
html, body { height: 100%; }
#root { display: flex; height: 100%; flex: 1; }
`;
