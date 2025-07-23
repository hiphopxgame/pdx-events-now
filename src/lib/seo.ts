// Utility functions for creating SEO-friendly URLs
export const createSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
    .substring(0, 50); // Limit length
};

export const createEventUrl = (title: string, id: string): string => {
  const slug = createSlug(title);
  return `/event/${slug}-${id}`;
};

export const createVenueUrl = (name: string, id: string): string => {
  const slug = createSlug(name);
  return `/venue/${slug}-${id}`;
};

export const createUserUrl = (name: string, id: string): string => {
  const slug = createSlug(name || 'user');
  return `/user/${slug}-${id}`;
};

export const extractIdFromSlug = (slug: string): string => {
  // Extract ID from the end of the slug (after last hyphen)
  const parts = slug.split('-');
  return parts[parts.length - 1];
};

// Social sharing utilities
export const shareUrls = {
  facebook: (url: string, title: string) => 
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`,
  
  twitter: (url: string, title: string) => 
    `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  
  linkedin: (url: string, title: string, description: string) => 
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description)}`,
  
  whatsapp: (url: string, title: string) => 
    `https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`,
  
  email: (url: string, title: string, description: string) => 
    `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${url}`)}`,
  
  copy: async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch (err) {
      return false;
    }
  }
};

// Open Graph meta management
export const updateMetaTags = (meta: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}) => {
  // Update document title
  if (meta.title) {
    document.title = `${meta.title} - Portland.Events`;
  }

  // Update meta tags
  const updateMeta = (property: string, content: string) => {
    let element = document.querySelector(`meta[property="${property}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute('property', property);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  if (meta.title) updateMeta('og:title', meta.title);
  if (meta.description) updateMeta('og:description', meta.description);
  if (meta.image) updateMeta('og:image', meta.image);
  if (meta.url) updateMeta('og:url', meta.url);
  if (meta.type) updateMeta('og:type', meta.type);
};