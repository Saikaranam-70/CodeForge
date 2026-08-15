import React from "react";
import useSEO from "../hooks/useSEO";

/**
 * Declarative SEO Head Component
 * Usage: <SEOHead title="Two Sum" description="Solve Two Sum with optimal O(n) hash map" jsonLd={...} />
 */
const SEOHead = ({
  title,
  description,
  keywords,
  canonical,
  ogType,
  ogImage,
  jsonLd
}) => {
  useSEO({
    title,
    description,
    keywords,
    canonical,
    ogType,
    ogImage,
    jsonLd
  });

  return null;
};

export default SEOHead;
