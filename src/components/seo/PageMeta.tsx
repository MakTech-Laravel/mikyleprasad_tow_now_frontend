import { Helmet } from 'react-helmet-async';

import { SITE_NAME } from '@/components/seo/siteName';

export type PageMetaProps = {
  title: string;
  description?: string;
  keywords?: string | string[];
};

function formatKeywords(keywords: string | string[] | undefined): string | undefined {
  if (keywords === undefined) return undefined;
  if (typeof keywords === 'string') return keywords.trim() || undefined;
  const joined = keywords.map((k) => k.trim()).filter(Boolean).join(', ');
  return joined || undefined;
}

export function PageMeta({ title, description, keywords }: PageMetaProps) {
  const trimmedTitle = title.trim();
  const documentTitle = trimmedTitle ? `${trimmedTitle} | ${SITE_NAME}` : SITE_NAME;
  const keywordsContent = formatKeywords(keywords);

  return (
    <Helmet>
      <title>{documentTitle}</title>
      {description !== undefined && description.trim() !== '' ? (
        <meta name="description" content={description.trim()} />
      ) : null}
      {keywordsContent !== undefined ? (
        <meta name="keywords" content={keywordsContent} />
      ) : null}
    </Helmet>
  );
}
