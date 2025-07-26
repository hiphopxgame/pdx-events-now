// Utility functions for URL handling

// Event utilities
export const createEventSlug = (title: string, id: string): string => {
  // Convert title to URL-friendly slug
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
  
  return `${slug}_${id}`;
};

export const getEventIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split('_');
  return parts[parts.length - 1]; // Return the ID part
};

// User utilities
export const createUserSlug = (username: string, displayName: string, id: string): string => {
  const name = username || displayName || 'user';
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  
  return `${slug}_${id}`;
};

export const getUserIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split('_');
  return parts[parts.length - 1];
};

// Media/Content utilities
export const createMediaSlug = (title: string, id: string): string => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  
  return `${slug}_${id}`;
};

export const getMediaIdFromSlug = (slug: string): string | null => {
  if (!slug) return null;
  const parts = slug.split('_');
  return parts[parts.length - 1];
};