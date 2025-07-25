// Security validation utilities

export const validateUrl = (url: string): boolean => {
  if (!url) return true; // Allow empty URLs
  
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  // Remove potential script tags and dangerous HTML
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

export const validateEventData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Required fields
  if (!data.title?.trim()) errors.push('Event title is required');
  if (!data.description?.trim()) errors.push('Event description is required');
  if (!data.venue_name?.trim()) errors.push('Venue name is required');
  
  // URL validations
  const urlFields = [
    'website_url', 'facebook_url', 'instagram_url', 'twitter_url', 
    'youtube_url', 'venue_website_url', 'venue_facebook_url', 
    'venue_instagram_url', 'venue_twitter_url', 'venue_youtube_url'
  ];
  
  urlFields.forEach(field => {
    if (data[field] && !validateUrl(data[field])) {
      errors.push(`Invalid URL format for ${field.replace('_', ' ')}`);
    }
  });
  
  // Text length limits
  if (data.title && data.title.length > 200) {
    errors.push('Event title must be less than 200 characters');
  }
  
  if (data.description && data.description.length > 5000) {
    errors.push('Event description must be less than 5000 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};