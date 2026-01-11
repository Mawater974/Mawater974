
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
}

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description = "Mawater974 - The Premium Marketplace for Cars, Spare Parts & Services in Qatar and the Middle East.",
  image = "/logo.png",
  type = 'website'
}) => {
  const location = useLocation();
  const siteUrl = 'https://mawater974.com';
  
  // Construct clean canonical URL
  const currentUrl = `${siteUrl}${location.pathname}`;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image.startsWith('http') ? image : `${siteUrl}${image}`} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content="Mawater974" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image.startsWith('http') ? image : `${siteUrl}${image}`} />
    </Helmet>
  );
};
