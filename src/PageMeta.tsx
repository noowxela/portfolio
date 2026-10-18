import { canonicalUrl, metaFor, ogImage, type RoutePath } from './routes.meta'

/** React 19 hoists these into document head on client navigations. */
export function PageMeta({ path }: { path: RoutePath }) {
  const meta = metaFor(path)
  const url = canonicalUrl(path)
  const image = ogImage()
  return (
    <>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Alex Woon" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={image} />
      {meta.noindex ? <meta name="robots" content="noindex" /> : null}
    </>
  )
}
