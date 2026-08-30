import Head from 'expo-router/head';

const ORIGIN = 'https://kranmal.github.io/lendly';
const OG_IMAGE = 'https://kranmal.github.io/og-image.png';

interface Props {
  /** Full <title> text for the route. */
  title: string;
  description: string;
  /** Route path relative to the app root, e.g. '' for home or 'items'. */
  path?: string;
  /** Keeps the route out of search results — used for the 404 page. */
  noindex?: boolean;
}

/**
 * Per-route title, description and canonical.
 *
 * These have to go through expo-router's Head rather than +html.tsx: the static
 * export always emits a helmet-managed <title> first, so a <title> declared in
 * +html.tsx would sit second and be ignored — leaving an empty title in search
 * results. Routing them through Head fills that first tag instead, and gives
 * each route its own canonical rather than pointing all three at the home page.
 */
export function SeoHead({ title, description, path = '', noindex = false }: Props) {
  const url = path ? `${ORIGIN}/${path}` : `${ORIGIN}/`;
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex ? <meta name="robots" content="noindex" /> : <link rel="canonical" href={url} />}

      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={OG_IMAGE} />
    </Head>
  );
}
