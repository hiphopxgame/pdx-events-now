export interface DomainConfig {
  name: string;
  title: string;
  description: string;
  locationFilter?: {
    cities?: string[];
    states?: string[];
    regions?: string[];
  };
  branding: {
    primary: string;
    tagline: string;
    heroTitle: string;
    heroSubtitle: string;
  };
}

export const domainConfigs: Record<string, DomainConfig> = {
  'public.events': {
    name: 'Public.Events',
    title: 'Public.Events - Discover Events Worldwide',
    description: 'Discover events and venues from around the world.',
    // No location filter - show all events globally
    branding: {
      primary: 'Public.Events',
      tagline: 'Discover Events Worldwide',
      heroTitle: 'Discover Events Worldwide',
      heroSubtitle: 'Find amazing events and venues from around the globe.'
    }
  },
  'dmv.events': {
    name: 'DMV.Events',
    title: 'DMV.Events - Discover DC Metro Area Events',
    description: 'Discover events and venues in the Washington DC Metro Area.',
    locationFilter: {
      cities: ['Washington', 'Alexandria', 'Arlington', 'Bethesda', 'Rockville', 'Silver Spring', 'Fairfax', 'Reston', 'Vienna', 'Falls Church'],
      states: ['DC', 'District of Columbia'],
      regions: ['DMV', 'DC Metro', 'Washington Metro']
    },
    branding: {
      primary: 'DMV.Events',
      tagline: 'Discover DC Metro Area Events',
      heroTitle: 'Discover DC Metro Area Events',
      heroSubtitle: 'Find amazing events and venues in Washington DC, Maryland, and Virginia.'
    }
  },
  'portland.events': {
    name: 'Portland.Events',
    title: 'Portland.Events - Discover Portland, Oregon Events',
    description: 'Discover the events and venues while exploring the local community of Portland, Oregon.',
    locationFilter: {
      cities: ['Portland'],
      states: ['Oregon', 'OR']
    },
    branding: {
      primary: 'Portland.Events',
      tagline: 'Discover Portland, Oregon Events',
      heroTitle: 'Discover Portland Events',
      heroSubtitle: 'Find amazing events and venues in the local Portland, Oregon community.'
    }
  }
};

export const getCurrentDomainConfig = (): DomainConfig => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  
  // Check for exact domain matches
  if (domainConfigs[hostname]) {
    return domainConfigs[hostname];
  }
  
  // Check for subdomain matches (e.g., staging.portland.events)
  for (const domain in domainConfigs) {
    if (hostname.endsWith(domain)) {
      return domainConfigs[domain];
    }
  }
  
  // Default to Portland.Events for localhost and unknown domains
  return domainConfigs['portland.events'];
};

export const getLocationFilter = () => {
  const config = getCurrentDomainConfig();
  return config.locationFilter;
};