import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://visitkoszeg.hu';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;
const SITE_NAME = 'visitKőszeg';
const BRAND_SLOGAN = 'Élmények. Élőben.';

/**
 * Oldalankénti SEO meta tagek.
 * Használat: <SEO title="..." description="..." url="/..." />
 */
export default function SEO({
    title,
    description,
    image = DEFAULT_IMAGE,
    url = '/',
    type = 'website',
    jsonLd = null,
    noindex = false,
    keywords = '',
}) {
    const fullTitle = (title && title !== 'Fedezd fel Kőszeg csodáit')
        ? `${title} · visitKőszeg – Élmények. Élőben.`
        : `${SITE_NAME} – ${BRAND_SLOGAN}`;
    const canonicalUrl = `${BASE_URL}${url}`;

    return (
        <Helmet>
            <title>{fullTitle}</title>
            {description && <meta name="description" content={description} />}
            {keywords && <meta name="keywords" content={keywords} />}
            <link rel="canonical" href={canonicalUrl} />
            {noindex && <meta name="robots" content="noindex, nofollow" />}

            {/* Open Graph */}
            <meta property="og:title" content={fullTitle} />
            {description && <meta property="og:description" content={description} />}
            <meta property="og:image" content={image.startsWith('http') ? image : `${BASE_URL}${image}`} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:type" content={type} />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:locale" content="hu_HU" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            {description && <meta name="twitter:description" content={description} />}
            <meta name="twitter:image" content={image.startsWith('http') ? image : `${BASE_URL}${image}`} />

            {/* JSON-LD */}
            {jsonLd && (
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            )}
        </Helmet>
    );
}
