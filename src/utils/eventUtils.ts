// Utility functions for event handling

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