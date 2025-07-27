// Utility functions for recurrence pattern handling

export const getRecurrenceTypeFromPattern = (pattern: string): string => {
  if (!pattern) return '';
  
  // Weekly events: "every" pattern (every sun-sat)
  if (pattern.startsWith('every-')) {
    return 'weekly';
  }
  
  // Monthly events: "1st", "2nd", "3rd", "4th", "5th", "last" patterns with days
  const monthlyPrefixes = ['first-', 'second-', 'third-', 'fourth-', 'fifth-', 'last-'];
  if (monthlyPrefixes.some(prefix => pattern.startsWith(prefix))) {
    return 'monthly';
  }
  
  return '';
};

export const isValidRecurrencePattern = (pattern: string): boolean => {
  if (!pattern) return false;
  
  const weeklyPattern = /^every-(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/;
  const monthlyPattern = /^(first|second|third|fourth|fifth|last)-(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/;
  
  return weeklyPattern.test(pattern) || monthlyPattern.test(pattern);
};

export const parseRecurrencePattern = (pattern: string): { type: string; dayOfWeek: string; occurrence?: string } | null => {
  if (!pattern) return null;
  
  // Weekly pattern: "every-monday"
  const weeklyMatch = pattern.match(/^every-(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/);
  if (weeklyMatch) {
    return {
      type: 'weekly',
      dayOfWeek: weeklyMatch[1]
    };
  }
  
  // Monthly pattern: "first-monday", "last-friday", etc.
  const monthlyMatch = pattern.match(/^(first|second|third|fourth|fifth|last)-(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/);
  if (monthlyMatch) {
    return {
      type: 'monthly',
      occurrence: monthlyMatch[1],
      dayOfWeek: monthlyMatch[2]
    };
  }
  
  return null;
};