import { useEffect } from "react";

/**
 * High-performance, zero-dependency Dynamic SEO Hook
 * Automatically manages title, description, canonical link, Open Graph, Twitter cards, and JSON-LD schema.
 */
export const useSEO = ({
  title = "",
  description = "",
  keywords = "",
  canonical = "",
  ogType = "website",
  ogImage = "https://codeforge.dev/favicon.svg",
  jsonLd = null
} = {}) => {
  useEffect(() => {
    // 1. Update Document Title
    const baseTitle = "CodeForge";
    const fullTitle = title ? `${title} | ${baseTitle}` : `${baseTitle} — Collaborative Coding Arena, NeetCode 150 & Online Judge`;
    document.title = fullTitle;

    // 2. Helper to set or update meta tag
    const setMetaTag = (attrName, attrVal, content) => {
      if (!content) return;
      let tag = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attrName, attrVal);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    // 3. Set standard SEO tags
    if (description) {
      setMetaTag("name", "description", description);
      setMetaTag("property", "og:description", description);
      setMetaTag("name", "twitter:description", description);
    }

    if (keywords) {
      setMetaTag("name", "keywords", keywords);
    }

    setMetaTag("property", "og:title", fullTitle);
    setMetaTag("name", "twitter:title", fullTitle);
    setMetaTag("property", "og:type", ogType);
    setMetaTag("property", "og:image", ogImage);
    setMetaTag("name", "twitter:image", ogImage);

    // 4. Update Canonical URL
    const url = canonical || (typeof window !== "undefined" ? window.location.href : "https://codeforge.dev");
    setMetaTag("property", "og:url", url);
    setMetaTag("name", "twitter:url", url);

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", url);

    // 5. Ingest Dynamic JSON-LD Structured Data
    const scriptId = "codeforge-dynamic-jsonld";
    let jsonLdScript = document.getElementById(scriptId);

    if (jsonLd) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement("script");
        jsonLdScript.id = scriptId;
        jsonLdScript.type = "application/ld+json";
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.textContent = JSON.stringify(jsonLd);
    } else if (jsonLdScript) {
      jsonLdScript.remove();
    }
  }, [title, description, keywords, canonical, ogType, ogImage, jsonLd]);
};

export default useSEO;
