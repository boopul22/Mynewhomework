import React from 'react';
import Head from 'next/head';
import { usePathname } from 'next/navigation';
import { Breadcrumb } from '../ui/breadcrumb';

interface PageWrapperProps {
  children: React.ReactNode;
  title: string;
  description: string;
  imageUrl?: string;
  noIndex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  keywords?: string[];
  type?: 'article' | 'product' | 'website';
  section?: string;
  alternateLanguages?: { [key: string]: string };
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  title,
  description,
  imageUrl,
  noIndex = false,
  publishedTime,
  modifiedTime,
  authors = [],
  keywords = [],
  type = 'website',
  section,
  alternateLanguages = {},
}) => {
  const pathname = usePathname();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com';
  const canonicalUrl = `${baseUrl}${pathname}`;

  // Generate structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type === 'article' ? 'Article' : type === 'product' ? 'Product' : 'WebPage',
    name: title,
    description: description,
    url: canonicalUrl,
    ...(imageUrl && { image: imageUrl }),
    ...(publishedTime && { datePublished: publishedTime }),
    ...(modifiedTime && { dateModified: modifiedTime }),
    ...(authors.length > 0 && {
      author: authors.map(author => ({
        '@type': 'Person',
        name: author,
      })),
    }),
    publisher: {
      '@type': 'Organization',
      name: 'Student Dashboard',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Keywords */}
        {keywords.length > 0 && (
          <meta name="keywords" content={keywords.join(', ')} />
        )}

        {/* Alternate Languages */}
        {Object.entries(alternateLanguages).map(([lang, url]) => (
          <link
            key={lang}
            rel="alternate"
            hrefLang={lang}
            href={`${baseUrl}${url}`}
          />
        ))}
        
        {/* Open Graph tags */}
        <meta property="og:type" content={type} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        {imageUrl && <meta property="og:image" content={imageUrl} />}
        {section && <meta property="article:section" content={section} />}
        {publishedTime && (
          <meta property="article:published_time" content={publishedTime} />
        )}
        {modifiedTime && (
          <meta property="article:modified_time" content={modifiedTime} />
        )}
        {authors.map((author, index) => (
          <meta key={index} property="article:author" content={author} />
        ))}
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {imageUrl && <meta name="twitter:image" content={imageUrl} />}
        
        {/* Robots meta */}
        {noIndex ? (
          <meta name="robots" content="noindex, nofollow" />
        ) : (
          <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        )}

        {/* Mobile viewport optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <div className="min-h-screen">
        <Breadcrumb />
        {children}
      </div>
    </>
  );
}; 